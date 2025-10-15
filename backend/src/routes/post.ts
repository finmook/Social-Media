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

  try {
    const post = await prisma.post.create({
      data: {
        authorId: u.id,
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

export default router;

