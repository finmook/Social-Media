'use client'
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Avatar, Button, Paper, Stack, TextField } from '@mui/material';
import NavBar from '@/components/NavBar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';

type Message = {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    readAt: string | null;
    createdAt: string;
};

export default function Chat(){
    const {friendId} = useParams<{friendId: string}>();
    const {token, loading} = useAuth();
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState('');
    const [myId, setMyId] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchData() {
            if (loading || !token) return;
            const headers = { Authorization: `Bearer ${token}` };

            const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, { headers });
            const profileData = await profileRes.json();
            setProfilePic(profileData?.user?.avatarUrl ?? null);
            setMyId(profileData?.user?.id ?? null);

            const messagesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/message/${friendId}`, { headers });
            const messagesData = await messagesRes.json();
            setMessages(messagesData.messages ?? []);
        }
        fetchData();
    }, [token, friendId]);

    useEffect(() => {
        if (!myId || !friendId) return;

        const chan = supabase
            .channel(`chat-${myId}-${friendId}`)
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'Message' },
                (payload) => {
                    const msg = payload.new as Message;
                    const belongsToThisChat =
                        (msg.senderId === myId && msg.receiverId === friendId) ||
                        (msg.senderId === friendId && msg.receiverId === myId);
                    if (!belongsToThisChat) return;

                    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
                }
            )
            .subscribe((status) => {
                console.log('realtime status:', status);
            });

        return () => { supabase.removeChannel(chan); };
    }, [myId, friendId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function sendMessage(e: React.FormEvent) {
        e.preventDefault();
        const content = text.trim();
        if (!content || !token) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ receiverId: friendId, content }),
        });

        if (res.ok) {
            setText('');
        }
    }

    if (loading) return <div>Loading...</div>;

    return (
        <div className="flex flex-col items-center w-12/12">
            <Stack spacing={3} sx={{ width: '100%' }}>
                <NavBar profilePic={profilePic} />
                <div className="flex justify-center">
                    <Paper sx={{ width: { xs: '100%', sm: 500 }, p: 3, display: 'flex', flexDirection: 'column', height: 500 }} elevation={3}>
                        <Stack spacing={1} sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
                            {messages.map((m) => (
                                <div key={m.id} className={`flex ${m.senderId === myId ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`px-3 py-2 rounded-lg max-w-[70%] ${m.senderId === myId ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            <div ref={bottomRef} />
                        </Stack>
                        <form onSubmit={sendMessage}>
                            <Stack direction="row" spacing={1}>
                                <TextField
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Type a message..."
                                    fullWidth
                                    size="small"
                                />
                                <Button type="submit" variant="contained">Send</Button>
                            </Stack>
                        </form>
                    </Paper>
                </div>
            </Stack>
        </div>
    );
}
