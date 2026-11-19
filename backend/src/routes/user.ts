import { Router, Request } from 'express';

import { requireAuth } from '../middleware/requireAuth';
import prisma from '../script';
import { getSupabaseForToken } from '../lib/supabase';



const router = Router();

router.use(requireAuth);

router.get('/list',async (req,res)=>{
  const authUser= (req as any).authUser;
  const rows=await prisma.user.findMany({
    where: {sub:{not: authUser.id}},
    select:{
      id:true,
      displayName:true,
      avatarUrl:true,
    },
  });
  res.json({users:rows});
});

router.get('/', async (req, res) => {
  const authUser = (req as any).authUser;
  const row = await prisma.user.findUnique({ where: { sub: authUser.id } });
  res.json({ user: row });
});

router.post('/', requireAuth, async (req, res) => {
  const u = (req as any).authUser as { id: string; email?: string };
  const { displayName, avatarUrl: rawAvatarUrl, googleAvatarUrl } = req.body;

  let avatarUrl = rawAvatarUrl ?? null;

  if (googleAvatarUrl) {
    try {
      const token = (req.headers.authorization || '').replace('Bearer ', '');
      const supabase = getSupabaseForToken(token);

      const imgRes = await fetch(googleAvatarUrl);
      const arrayBuffer = await imgRes.arrayBuffer();
      const filePath = `${u.id}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, Buffer.from(arrayBuffer), {
          upsert: true,
          contentType: imgRes.headers.get('content-type') ?? 'image/jpeg',
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        avatarUrl = urlData.publicUrl;
      } else {
        console.error(uploadError);
      }
    } catch (err) {
      console.error(err);
    }
  }

  try {

    const row = await prisma.user.upsert({
      where: { sub: u.id },
      create: {
        sub: u.id,
        email: u.email!,
        displayName: displayName ?? null,
        avatarUrl: avatarUrl ?? null,
      },
      update: {
        displayName: displayName ?? null,
        avatarUrl: avatarUrl ?? null,
      },
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
