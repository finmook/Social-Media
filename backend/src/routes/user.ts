import { Router, Request } from 'express';

import { requireAuth } from '../middleware/requireAuth';
import prisma from '../script';



const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  const authUser = (req as any).authUser;
  const row = await prisma.user.findUnique({ where: { sub: authUser.id } });
  res.json({ user: row });
});

router.post('/', requireAuth, async (req, res) => {
  const u = (req as any).authUser as { id: string; email?: string };
  const { displayName, handle, avatarUrl } = req.body;

  try {
    
    const row = await prisma.user.upsert({
      where: { sub: u.id },              
      create: {
        sub: u.id,
        email: u.email!,                 
        displayName: displayName ?? null,
        handle: handle ?? null,
        avatarUrl: avatarUrl ?? null,
      },
      update: {},                        
    });
    return res.status(201).json({ user: row });
  } catch (e: any) {
    
    if (e.code === 'P2002') {
      return res.status(409).json({ error: 'User already exists' });
    }
    return res.status(500).json({ error: 'Internal error' });
  }
});


export default router;
