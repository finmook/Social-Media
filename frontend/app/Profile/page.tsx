'use client'
import {useEffect, useState} from 'react';
import { Avatar, Button, Paper, Stack, TextField } from '@mui/material';
import Image from 'next/image';
import NavBar from '@/components/NavBar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
type UserProfile = {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
};
export default function Profile(){
    const {token,loading}=useAuth();
    const [user,setUser]=useState<UserProfile|null>(null);
    const [displayName, setDisplayName] = useState('');
    const [saving, setSaving] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        async function fetchProfile() {
            if(loading || !token) return;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setUser(data.user);
            setDisplayName(data.user?.displayName ?? '');
        }
        fetchProfile();
    }, [token]);
    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (loading || !token || !user) return;
        setSaving(true);

        let avatarUrl = user.avatarUrl;

        if (file) {
            const ext = file.name.split('.').pop();
            const filePath = `${user.id}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (!uploadError) {
                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
                avatarUrl = urlData.publicUrl;
            } else {
                console.error(uploadError);
            }
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ displayName, avatarUrl })
        });

        if (res.ok) {
            const { user: updated } = await res.json();
            setUser(updated);
            setFile(null);
            setPreview(null);
        }

        setSaving(false);
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] ?? null;
        setFile(f);
        setPreview(f ? URL.createObjectURL(f) : null);
    }

    if (loading) return <div>Loading...</div>;

    return (
        <div className="flex flex-col items-center w-12/12">
            <Stack spacing={5} sx={{ width: '100%' }}>
                <NavBar profilePic={user?.avatarUrl} />
                <div className="flex justify-center">
                    <Paper sx={{ width: { xs: '100%', sm: 500 }, p: 4 }} elevation={3}>
                        <Stack spacing={3} alignItems="center">
                            {/* <Avatar src={user?.avatarUrl ?? undefined} sx={{ width: 96, height: 96 }} /> */}
                            <div className="mb-4 h-3/12">
                                <div className="relative flex rounded-full bg-white w-20 h-20 items-center justify-center border-4 border-gray-300">
                                    {preview ? (
                                        <img
                                            alt="Profile Picture"
                                            src={preview}
                                            width={70}
                                            height={70}
                                            className="rounded-full object-cover"
                                            style={{ width: 70, height: 70 }}
                                        />
                                    ) : user?.avatarUrl ? (
                                        <img
                                            alt="Profile Picture"
                                            src={user.avatarUrl}
                                            width={70}
                                            height={70}
                                            className="rounded-full object-cover"
                                            style={{ width: 70, height: 70 }}
                                        />
                                    ) : (
                                        <Image
                                            alt="Profile Picture"
                                            src="/user.svg"
                                            width={70}
                                            height={70}
                                            className="rounded-full"
                                        />
                                    )}
                                    <input
                                        type="file"
                                        id="profilePic"
                                        name="profilePic"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleChange}
                                    />
                                    <label
                                        htmlFor="profilePic"
                                        className="absolute -bottom-1 -right-1 cursor-pointer rounded-full bg-white p-2 shadow ring-2 ring-white"
                                    >
                                     <Image alt="camera icon" src="/Camera.svg" width={20} height={20} />
                                    </label>
                                </div>

                            </div> 
                            <TextField label="Email" value={user?.email ?? ''} fullWidth disabled />
                            <form onSubmit={handleSave} style={{ width: '100%' }}>
                                <Stack spacing={2}>
                                    <TextField
                                        label="Display name"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
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
