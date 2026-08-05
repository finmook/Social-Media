'use client'
import {useEffect, useState} from 'react';
import { Avatar, Button, Paper, Stack, TextField } from '@mui/material';
import NavBar from '@/components/NavBar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
type UserProfile = {
    id: string;
    email: string;
    displayName: string | null;
    handle: string | null;
    avatarUrl: string | null;
};
export default function Profile(){
    const {token,loading}=useAuth();
    const [user,setUser]=useState<UserProfile|null>(null);
    const [displayName, setDisplayName] = useState('');
    const [handle, setHandle] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function fetchProfile() {
            if(loading || !token) return;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setUser(data.user);
            setDisplayName(data.user?.displayName ?? '');
            setHandle(data.user?.handle ?? '');
        }
        fetchProfile();
    }, [token]);
    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if(loading || !token) return;
        setSaving(true);
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ displayName, handle, avatarUrl: user?.avatarUrl ?? null })
        });
        setSaving(false);
    }

    if (loading) return <div>Loading...</div>;

    return (
        <div className="flex flex-col items-center w-12/12">
            <Stack spacing={5} sx={{ width: '100%' }}>
                <NavBar profilePic={user?.avatarUrl} />
                <div className="flex justify-center">
                    <Paper sx={{ width: { xs: '100%', sm: 500 }, p: 4 }} elevation={3}>
                        <Stack spacing={3} alignItems="center">
                            <Avatar src={user?.avatarUrl ?? undefined} sx={{ width: 96, height: 96 }} />
                            <TextField label="Email" value={user?.email ?? ''} fullWidth disabled />
                            <form onSubmit={handleSave} style={{ width: '100%' }}>
                                <Stack spacing={2}>
                                    <TextField
                                        label="Display name"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        fullWidth
                                    />
                                    <TextField
                                        label="Handle"
                                        value={handle}
                                        onChange={(e) => setHandle(e.target.value)}
                                        fullWidth
                                    />
                                    <Button type="submit" variant="contained" disabled={saving}>
                                        {saving ? 'Saving…' : 'Save changes'}
                                    </Button>
                                </Stack>
                            </form>
                        </Stack>
                    </Paper>
                </div>
            </Stack>
        </div>
    );
}                                    
