// frontend/app/auth/callback/page.tsx
'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Callback() {
  const router = useRouter();
  const q = useSearchParams();
  
  useEffect(() => {
    (async () => {
      const code = q.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) { console.error(error); return; }
      } else {
        await supabase.auth.getSession();
      }

      const { data: { session } } = await supabase.auth.getSession();
      console.log(session);
      console.log('token prefix:', session?.access_token?.slice(0, 25)); 
      if (session) {
        
       
          const meta = session.user.user_metadata || {};
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            displayName: meta.name ?? meta.full_name ?? '',
            handle: meta.handle ?? '',
            avatarUrl: meta.avatar_url ?? null,
          }),
        });
        
        
      }
      router.push('/Feed');
    })();
  }, [q, router]);

  return <p className="flex justify-center items-center min-h-dvh ">Finishing sign in…</p>;
}
