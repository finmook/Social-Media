'use client'
import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Avatar,Button, Divider, List, ListItem, ListItemAvatar, ListItemText, Paper, Stack, TextField, Typography} from '@mui/material';
import NavBar from '@/components/NavBar';
import {supabase} from '@/lib/supabase';
import {useAuth} from '@/lib/useAuth';

type Contact = {
    id: string;
    displayName: string| null;
    handle: string | null;
    avatarUrl: string | null;
};

type PendingRequest = {
    id: string;
    requesterId: string;
    addresseeId: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
    createdAt: string;
    updatedAt: string;
    requester: Contact;
}

export default function Contacts(){
    const router = useRouter();
    const {token,loading}=useAuth();
    const [profilePic, setProfilePic]= useState<string | null>(null);
    const [contacts, setContacts]= useState<Contact[]>([]);
    const [friendIds, setFriendIds]=useState<Set<string>>(new Set());
    const [sentIds, setSentIds] = useState<Set<string>>(new Set());
    const [pending, setPending]=useState<PendingRequest[]>([]);
    const [query,setQuery]= useState('');
    
    useEffect(()=>{
        async function fetchData(){
            if(loading || !token) return;
            const headers= {Authorization:`Bearer ${token}`};
            const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`,{
                headers: headers
            });
            const profileData= await profileRes.json();
            setProfilePic(profileData?.user?.avatarUrl ?? null);

            const listRes= await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/list`,{
                headers: headers
            });

            const listData=await listRes.json();
            setContacts(listData.users ?? []);

            const friendsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend`,{
                headers:headers
            })
            const friendsData= await friendsRes.json();
            setFriendIds(new Set((friendsData.friends ?? []).map((f: Contact)=>f.id)));
            
            const requestsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend/requests`, { headers });
            const requestsData = await requestsRes.json();
            setPending(requestsData.requests ?? []);

            
        }
        fetchData();
    },[token]);

    async function handleAdd(addresseeId: string) {
                if (!token) return;
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend/request`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ addresseeId }),
                });
                if (res.ok) setSentIds((prev) => new Set(prev).add(addresseeId));
            }

    async function handleAccept(requesterId: string, friendshipId: string) {
        if (!token) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friend/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ requesterId }),
        });
        if (res.ok) {
            setPending((prev) => prev.filter((r) => r.id !== friendshipId));
            setFriendIds((prev) => new Set(prev).add(requesterId));
        }
    }

    const filtered = contacts.filter((c)=> `${c.displayName ?? ''} ${c.handle ?? ''}`.toLowerCase().includes(query.toLowerCase()));
    if(loading) return <div>Loading...</div>
    return (
        <div className="flex flex-col items-center w-12/12">
            <Stack spacing={5} sx={{ width: '100%' }}>
                <NavBar profilePic={profilePic} />
                <div className="flex justify-center">
                    <Paper sx={{ width: { xs: '100%', sm: 500 }, p: 3 }} elevation={3}>
                        <Stack spacing={2}>
                            {pending.length > 0 && (
                                <>
                                    <Typography variant="subtitle2">Friend requests</Typography>
                                    <List>
                                        {pending.map((r) => (
                                            <ListItem
                                                key={r.id}
                                                secondaryAction={
                                                    <Button size="small" variant="contained" onClick={() => handleAccept(r.requester.id, r.id)}>
                                                        Accept
                                                    </Button>
                                                }
                                            >
                                                <ListItemAvatar>
                                                    <Avatar src={r.requester.avatarUrl ?? undefined} />
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={r.requester.displayName ?? 'Unnamed'}
                                                    secondary={r.requester.handle ? `@${r.requester.handle}` : undefined}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                    <Divider />
                                </>
                            )}
                            <TextField
                                label="Search contacts"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                fullWidth
                            />
                            <List>
                                {filtered.map((contact) => {
                                    const isFriend = friendIds.has(contact.id);
                                    const isSent = sentIds.has(contact.id);
                                    return (
                                    <ListItem
                                        key={contact.id}
                                        secondaryAction={
                                                isFriend ? (
                                                    <Button size="small" variant="contained" onClick={() => router.push(`/Chat/${contact.id}`)}>
                                                        Message
                                                    </Button>
                                                ) : (
                                                    <Button size="small" variant="outlined" disabled={isSent} onClick={() => handleAdd(contact.id)}>
                                                        {isSent ? 'Requested' : 'Add'}
                                                    </Button>
                                                )
                                        }
                                    >
                                        <ListItemAvatar>
                                            <Avatar src={contact.avatarUrl ?? undefined} />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={contact.displayName ?? 'Unnamed'}
                                            secondary={contact.handle ? `@${contact.handle}` : undefined}
                                        />
                                    </ListItem>
                                )})}
                            </List>
                        </Stack>
                    </Paper>
                </div>
            </Stack>
        </div>
    );
}
