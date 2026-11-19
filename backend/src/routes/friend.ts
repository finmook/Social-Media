import { Router, Request } from 'express';

import { requireAuth } from '../middleware/requireAuth';
import prisma from '../script';

const router = Router();

router.use(requireAuth);

// List pending requests sent to me
router.get('/requests', async (req, res) => {
  const me = (req as any).authUser as { id: string };
  const meRow = await prisma.user.findUnique({ where: { sub: me.id } });
  if (!meRow) return res.status(404).json({ error: 'user not found' });

  const requests = await prisma.friendship.findMany({
    where: { addresseeId: meRow.id, status: 'PENDING' },
    include: { requester: { select: { id: true, displayName: true, avatarUrl: true } } },
  });
  res.json({ requests });
});

//get friend list(accepted)
router.get('/',async (req,res)=>{
    //check myself id
    const me=(req as any).authUser as {id:string};
    const meRow = await prisma.user.findUnique({where: {sub:me.id}});
    if(!meRow) return res.status(404).json({error: 'user not found'});

    //get friendships relation
    const friendships=await prisma.friendship.findMany({
        where: {status: 'ACCEPTED',OR: [{requesterId:meRow.id},{addresseeId:meRow.id}]},
        include:{
            requester: {select: {id:true,displayName:true,avatarUrl:true}},
            addressee: {select: {id: true, displayName:true, avatarUrl:true}},
        }
    });
    
    //get friends
    const friends = friendships.map((f)=>(f.requesterId === meRow.id ? f.addressee : f.requester));
    res.json({friends});
});

// Send a friend request (auto-accepts if they already requested you)
router.post('/request', async (req, res) => {
  const me = (req as any).authUser as { id: string };
  const { addresseeId } = req.body as { addresseeId?: string };

  if (!addresseeId) return res.status(400).json({ error: 'addresseeId is required' });

  const meRow = await prisma.user.findUnique({ where: { sub: me.id } });
  if (!meRow) return res.status(404).json({ error: 'user not found' });
  if (addresseeId === meRow.id) return res.status(400).json({ error: 'cannot friend yourself' });

  const reverse = await prisma.friendship.findUnique({
    where: { requesterId_addresseeId: { requesterId: addresseeId, addresseeId: meRow.id } },
  });

  if (reverse) {
    if (reverse.status === 'ACCEPTED') return res.status(409).json({ error: 'already friends' });
    const updated = await prisma.friendship.update({
      where: { id: reverse.id },
      data: { status: 'ACCEPTED' },
    });
    return res.status(200).json({ friendship: updated });
  }

  try {
    const friendship = await prisma.friendship.create({
      data: { requesterId: meRow.id, addresseeId, status: 'PENDING' },
    });
    return res.status(201).json({ friendship });
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'request already sent' });
    return res.status(500).json({ error: 'internal error' });
  }
});


router.post('/accept',async (req,res)=>{
    const me= (req as any).authUser as {id:string};
    const {requesterId}= req.body as {requesterId?: string};
    if(!requesterId) return res.status(400).json({error:'requesterId is required'});

    const meRow= await prisma.user.findUnique({where: {sub:me.id}});
    if(!meRow) return res.status(404).json({error: 'user not found'});

    const friendship = await prisma.friendship.findUnique({
        where: {requesterId_addresseeId: {requesterId: requesterId, addresseeId:meRow.id}},
    });
    if(!friendship || friendship.status!=='PENDING'){
        return res.status(404).json({error:'no pending request'});
    }

    const updated= await prisma.friendship.update({
        where: {id: friendship.id},
        data: {status: 'ACCEPTED'},
    });
    res.json({friendship: updated});
})


export default router;

