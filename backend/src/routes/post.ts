import { Router, Request } from 'express';

import { requireAuth } from '../middleware/requireAuth';
import prisma from '../script';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      content: true,
      images: true,                 // string[]
      author: { select: { displayName: true, avatarUrl: true } }
    }
  });
  res.json({ posts });
});

router.post('/', requireAuth, async (req, res) => {
  const u = (req as any).authUser as { id: string };
  const { content, images } = req.body as {
    content?: string;
    images?: string[]; // Supabase Storage paths or URLs
  };

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'content is required' });
  }
  const me = await prisma.user.findUnique({
    where: { sub: u.id },
    select: { id: true },
  });

  if (!me) {
    return res.status(404).json({ error: 'User not found' });
  }

  try {
    const post = await prisma.post.create({
      data: {
        authorId: me.id,
        content: content.trim(),
        images: Array.isArray(images) ? images : [],
        // likeCount uses default(0); createdAt uses default(now())
      },
    });

    return res.status(201).json({ post });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: 'failed to create post' });
  }
});

// routes/post.ts
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      content: true,
      images: true,
      author: { select: { displayName: true, avatarUrl: true } }
    }
  });
  if (!post) return res.status(404).json({ error: 'not found' });
  res.json({ post });
});


export default router;

