'use client'
import { useState } from 'react';

import GoogleButton from '@/components/GoogleButton';
import TextField from '@mui/material/TextField';
import { Paper, Stack, Button, Divider } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) return setErr(error.message);

    
    router.push('/Feed'); 
  }
  return (
    <div className="flex flex-col justify-center items-center h-dvh w-12/12">
      <Paper sx={{ width: { xs: "100%", sm: 600 }, py: 3, px: 3, height: { sm: 500 } }} elevation={3} className='flex flex-col justify-center items-center'>
        <div className="w-12/12 h-4/12 flex justify-center items-center my-3">
          <h1 className="font-bold text-xl">
            Login
          </h1>
        </div>
        <div className='w-5/12 h-10/12'>
          <form onSubmit={handleSubmit}>
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
                variant='outlined'
              />
              <TextField id="password" 
                label="Password"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                fullWidth
                variant="outlined" />
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
              <Link href="/Register" className='text-xs text-center'>Don't have an account? Sign up.</Link>
            </Stack>
          </form>
        </div>
      </Paper>


    </div>
  );
}
