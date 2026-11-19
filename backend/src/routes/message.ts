import { Router, Request, Response } from 'express';

import { requireAuth } from '../middleware/requireAuth';
import prisma from '../script';
import { broadcast, dmTopic, inboxTopic } from '../lib/realtime';

const router = Router();

router.use(requireAuth);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_LENGTH = 2000;
const PAGE_SIZE = 30;

const publicUser = { id: true, displayName: true, avatarUrl: true } as const;

async function getMe(req: Request, res: Response) {
  const authUser = (req as any).authUser as { id: string };
  const meRow = await prisma.user.findUnique({ where: { sub: authUser.id }, select: { id: true } });
  if (!meRow) res.status(404).json({ error: 'user not found' });
  return meRow;
}

async function areFriends(userAId: string, userBId: string) {
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: 'ACCEPTED',
      OR: [
        { requesterId: userAId, addresseeId: userBId },
        { requesterId: userBId, addresseeId: userAId },
      ],
    },
    select: { id: true },
  });
  return !!friendship;
}

// List all friends as conversations, with last message + unread count
router.get('/conversations', async (req, res) => {
  const me = await getMe(req, res);
  if (!me) return;

  const friendships = await prisma.friendship.findMany({
    where: { status: 'ACCEPTED', OR: [{ requesterId: me.id }, { addresseeId: me.id }] },
    include: { requester: { select: publicUser }, addressee: { select: publicUser } },
  });
  const friends = friendships.map((f) => (f.requesterId === me.id ? f.addressee : f.requester));

  const unreadGroups = await prisma.message.groupBy({
    by: ['senderId'],
    where: { receiverId: me.id, readAt: null },
    _count: { _all: true },
  });
  const unreadBySender = new Map(unreadGroups.map((g) => [g.senderId, g._count._all]));

  const conversations = await Promise.all(
    friends.map(async (friend) => {
      const lastMessage = await prisma.message.findFirst({
        where: {
          OR: [
            { senderId: me.id, receiverId: friend.id },
            { senderId: friend.id, receiverId: me.id },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
      return { friend, lastMessage, unreadCount: unreadBySender.get(friend.id) ?? 0 };
    })
  );

  // Most recent conversations first, then friends you haven't talked to yet (A-Z)
  conversations.sort((a, b) => {
    if (a.lastMessage && b.lastMessage) {
      return b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime();
    }
    if (a.lastMessage) return -1;
    if (b.lastMessage) return 1;
    return (a.friend.displayName ?? '').localeCompare(b.friend.displayName ?? '');
  });

  res.json({ me: me.id, inboxTopic: inboxTopic(me.id), conversations });
});

// Get a page of the conversation with a friend (newest page first, returned oldest -> newest)
router.get('/:friendId', async (req, res) => {
  const { friendId } = req.params;
  if (!UUID_RE.test(friendId)) return res.status(400).json({ error: 'invalid friendId' });

  const me = await getMe(req, res);
  if (!me) return;
  if (!(await areFriends(me.id, friendId))) return res.status(403).json({ error: 'not friends' });

  const before = typeof req.query.before === 'string' ? new Date(req.query.before) : null;
  if (before && Number.isNaN(before.getTime())) return res.status(400).json({ error: 'invalid before' });

  const [friend, page] = await Promise.all([
    prisma.user.findUnique({ where: { id: friendId }, select: publicUser }),
    prisma.message.findMany({
      where: {
        OR: [
          { senderId: me.id, receiverId: friendId },
          { senderId: friendId, receiverId: me.id },
        ],
        ...(before ? { createdAt: { lt: before } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE + 1,
    }),
  ]);

  const hasMore = page.length > PAGE_SIZE;
  const messages = page.slice(0, PAGE_SIZE).reverse();

  res.json({ friend, messages, hasMore, topic: dmTopic(me.id, friendId) });
});

// Send a message to a friend
router.post('/', async (req, res) => {
  const { receiverId, content } = req.body as { receiverId?: string; content?: string };
  const text = content?.trim();

  if (!receiverId || !UUID_RE.test(receiverId) || !text) {
    return res.status(400).json({ error: 'receiverId and content are required' });
  }
  if (text.length > MAX_LENGTH) {
    return res.status(400).json({ error: `message is too long (max ${MAX_LENGTH} characters)` });
  }

  const me = await getMe(req, res);
  if (!me) return;
  if (!(await areFriends(me.id, receiverId))) return res.status(403).json({ error: 'not friends' });

  const message = await prisma.message.create({
    data: { senderId: me.id, receiverId, content: text },
  });

  await broadcast([
    { topic: dmTopic(me.id, receiverId), event: 'message', payload: message },
    { topic: inboxTopic(receiverId), event: 'message', payload: message },
    { topic: inboxTopic(me.id), event: 'message', payload: message },
  ]);

  res.status(201).json({ message });
});

// Mark every message the friend sent me as read
router.post('/:friendId/read', async (req, res) => {
  const { friendId } = req.params;
  if (!UUID_RE.test(friendId)) return res.status(400).json({ error: 'invalid friendId' });

  const me = await getMe(req, res);
  if (!me) return;

  const readAt = new Date();
  const { count } = await prisma.message.updateMany({
    where: { senderId: friendId, receiverId: me.id, readAt: null },
    data: { readAt },
  });

  if (count > 0) {
    await broadcast([
      { topic: dmTopic(me.id, friendId), event: 'read', payload: { readerId: me.id, readAt } },
    ]);
  }

  res.json({ updated: count });
});

export default router;
