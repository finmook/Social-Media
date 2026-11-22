'use client'
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import GoogleButton from '@/components/GoogleButton';
import AuthShell, { authInput, authLabel, authPrimaryBtn, OrDivider } from '@/components/AuthShell';

export default function RegisterPage() {
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email: email.trim(),
            password: password.trim(),
            options: {
                data: { displayName: displayName.trim() },
                emailRedirectTo: `${window.location.origin}/Login`,
            },
        });
        setLoading(false);
        if (error) return setErr(error.message);
        setDone(true);
    }

    if (done) {
        return (
            <AuthShell>
                <div>
                    <h1 className="text-2xl font-bold text-fg">Check your email</h1>
                    <p className="mt-2 text-sm text-muted">
                        We sent a confirmation link to <span className="font-medium text-fg">{email.trim()}</span>.
                        Confirm your account, then sign in.
                    </p>
                    <Link href="/Login" className={`${authPrimaryBtn} mt-8`}>
                        Go to sign in
                    </Link>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            footer={
                <>
                    Already have an account?{' '}
                    <Link href="/Login" className="font-medium text-accent hover:underline">Sign in</Link>
                </>
            }
        >
            <h1 className="text-2xl font-bold text-fg sm:text-3xl">Create your account</h1>
            <p className="mt-2 text-muted">Join and start connecting with friends.</p>

            <form onSubmit={handleRegister} className="mt-8 flex flex-col gap-4">
                <div>
                    <label htmlFor="display-name" className={authLabel}>Display name</label>
                    <input
                        id="display-name"
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        autoComplete="nickname"
                        placeholder="How friends will see you"
                        className={authInput}
                    />
                </div>
                <div>
                    <label htmlFor="email" className={authLabel}>Email</label>
                    <input
                        id="email"
                        type="email"
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
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        placeholder="At least 6 characters"
                        className={authInput}
                    />
                </div>

                {err && (
                    <p role="alert" className="rounded-xl bg-danger-soft px-4 py-2.5 text-sm text-danger ring-1 ring-danger">
                        {err}
                    </p>
                )}

                <button type="submit" disabled={loading} className={authPrimaryBtn}>
                    {loading ? 'Creating account…' : 'Create account'}
                </button>
                <OrDivider />
                <GoogleButton />
            </form>

        </AuthShell>
    );
}
