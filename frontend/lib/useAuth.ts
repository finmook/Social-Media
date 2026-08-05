'use client'
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import type {Session} from '@supabase/supabase-js';
import {supabase} from '@/lib/supabase';

export function useAuth(){
    const router = useRouter();
    const [session, setSession]= useState<Session|null>(null);
    const [loading,setLoading]=useState(true);

    useEffect(()=>{
        async function fetchSession(){
            const {data:{session}}=await supabase.auth.getSession();
            if(!session){
                router.push('/Login');
                return;
            }
            setSession(session);
            setLoading(false);
        } 
        fetchSession();
        const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
            if(!session){
                router.push('/Login');
                return;
            }else{
                setSession(session);
                setLoading(false);
            }
        });
        return ()=> subscription.unsubscribe();
    },[router]);
    return {session, token: session?.access_token, loading};
}