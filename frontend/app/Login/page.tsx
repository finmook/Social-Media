'use client'
import { useState } from 'react';

import GoogleButton from '@/components/GoogleButton';
import AuthShell, { authInput, authLabel, authPrimaryBtn, OrDivider } from '@/components/AuthShell';
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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      return setErr(error.message);
    }

    const token = data.session?.access_token;
    if (token) {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { user } = await res.json();

      if (!user) {
        const meta = data.session.user.user_metadata || {};
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            displayName: meta.displayName ?? '',
          }),
        });
      }
    }

    setLoading(false);
    router.push('/Feed');
  }
  return (
    <AuthShell
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link href="/Register" className="font-medium text-accent hover:underline">Sign up</Link>
        </>
      }
    >
      <h1 className="text-2xl font-bold text-fg sm:text-3xl">Welcome back</h1>
      <p className="mt-2 text-muted">Sign in to continue to your feed.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <label htmlFor="email" className={authLabel}>Email</label>
          <input
            id="email"
            type="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            className={authInput}
          />
        </div>
        <div>
          <label htmlFor="password" className={authLabel}>Password</label>
          <input
            id="password"
            type="password"
            name="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
            className={authInput}
          />
        </div>

        {err && (
          <p role="alert" className="rounded-xl bg-danger-soft px-4 py-2.5 text-sm text-danger ring-1 ring-danger">
            {err}
          </p>
        )}

        <button type="submit" disabled={loading} className={authPrimaryBtn}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <OrDivider />
        <GoogleButton />
      </form>

    </AuthShell>
  );
}
