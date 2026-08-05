import { Router, Request } from 'express';

import { requireAuth } from '../middleware/requireAuth';
import prisma from '../script';

const router = Router();

router.use(requireAuth);

async function areFriends(userAId: string, userBId: string) {
  const friendship = await prisma.friendship.findFirst({
    where: {
      status: 'ACCEPTED',
      OR: [
        { requesterId: userAId, addresseeId: userBId },
        { requesterId: userBId, addresseeId: userAId },
      ],
    },
  });
  return !!friendship;
}

// Get full conversation with a friend
router.get('/:friendId', async (req, res) => {
  const me = (req as any).authUser as { id: string };
  const { friendId } = req.params;

  const meRow = await prisma.user.findUnique({ where: { sub: me.id } });
  if (!meRow) return res.status(404).json({ error: 'user not found' });
  if (!(await areFriends(meRow.id, friendId))) return res.status(403).json({ error: 'not friends' });

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: meRow.id, receiverId: friendId },
        { senderId: friendId, receiverId: meRow.id },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  res.json({ messages });
});

// Send a message to a friend
router.post('/', async (req, res) => {
  const me = (req as any).authUser as { id: string };
  const { receiverId, content } = req.body as { receiverId?: string; content?: string };

  if (!receiverId || !content?.trim()) {
    return res.status(400).json({ error: 'receiverId and content are required' });
  }

  const meRow = await prisma.user.findUnique({ where: { sub: me.id } });
  if (!meRow) return res.status(404).json({ error: 'user not found' });
  if (!(await areFriends(meRow.id, receiverId))) return res.status(403).json({ error: 'not friends' });

  const message = await prisma.message.create({
    data: { senderId: meRow.id, receiverId, content: content.trim() },
  });

  res.status(201).json({ message });
});

export default router;