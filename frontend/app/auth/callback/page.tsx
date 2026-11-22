'use client';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function Spinner() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm text-muted">Finishing sign in…</p>
    </div>
  );
}

function CallbackInner() {
  const router = useRouter();
  const q = useSearchParams();

  useEffect(() => {
    (async () => {
      const code = q.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error(error);
          router.push('/Login');
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const token = session.access_token;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { user } = await res.json();

        if (!user) {
          const meta = session.user.user_metadata || {};
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              displayName: meta.name ?? meta.full_name ?? '',
              googleAvatarUrl: meta.avatar_url ?? null,
            }),
          });
        }
      }
      router.push('/Feed');
    })();
  }, [q, router]);

  return <Spinner />;
}

export default function Callback() {
  return (
    <Suspense fallback={<Spinner />}>
      <CallbackInner />
    </Suspense>
  );
}
