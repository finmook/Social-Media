'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TextField from '@mui/material/TextField';
import { Paper, Stack, Button } from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface Profile {
    fullName: string;
    email: string;
    profilePic: string;
}

export default function RegisterPage() {
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [handle, setHandle] = useState('');
    const router = useRouter();
    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] ?? null;
        setFile(f);
        setPreview(f ? URL.createObjectURL(f) : null);
    }
    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setEmail(email.trim());
        setPassword(password.trim());
        const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { data: { displayName, handle } },
        });
        if (error) { alert(error.message); setLoading(false); return; }
        if (data.session) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${data.session.access_token}`,
                },
                body: JSON.stringify({ displayName, handle }),
            });
            router.push('/');
        } else {
            router.push('/Login');
        }
    }
    return (
        <div className="flex flex-col justify-center items-center h-dvh w-12/12">
            <Paper sx={{ width: { xs: "100%", sm: 600 }, px: 2, height: { sm: 600 } }} elevation={3} className='flex flex-col justify-center items-center'>
                <div className="my-3 w-12/12 h-2/12  flex flex-col justify-center items-center">
                    <p className="font-bold text-xl my-0.5">
                        Register
                    </p>
                </div>
                <form className='flex flex-col justify-center items-center w-12/12' onSubmit={handleRegister}>
                    <div className="mb-4 h-3/12">
                        <div className="relative flex rounded-full bg-white w-20 h-20 items-center justify-center border-4 border-gray-300">
                            <Image
                                alt="Profile Picture"
                                src={`/user.svg`}
                                width={70}
                                height={70}
                                className="rounded-full"
                            />
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
                    <div className='w-5/12 h-10/12'>
                        <Stack direction="column" spacing={2}>
                            <TextField
                                id="email"
                                label="Email"
                                type="email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                fullWidth
                                variant="outlined"
                            />
                            <TextField
                                id="password"
                                label="Password"
                                type="password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                fullWidth
                                variant="outlined"
                            />
                            <TextField
                                id="display name"
                                label="display name"
                                type="text"
                                name="display name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                autoComplete="name"
                                fullWidth
                                variant="outlined"
                            />

                            <Button type='submit' variant="contained">{loading ? 'Signing up…' : 'Sign Up'}</Button>
                            <Link href="/Login" className='text-xs text-center'>Already have an account? Sign In.</Link>
                        </Stack>
                    </div>
                </form>

            </Paper>


        </div>
    );
}
