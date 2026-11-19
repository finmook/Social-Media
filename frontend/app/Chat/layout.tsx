'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import NavBar from '@/components/NavBar';
import ConversationList from '@/components/chat/ConversationList';
import { ChatContext, type ChatContextValue } from '@/components/chat/ChatContext';
import type { Conversation, Message } from '@/components/chat/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    const { token, loading } = useAuth();
    const params = useParams<{ friendId?: string }>();
    const activeFriendId = params?.friendId;

    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [myId, setMyId] = useState<string | null>(null);
    const [inboxTopic, setInboxTopic] = useState<string | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [listLoading, setListLoading] = useState(true);

    // Refs so realtime callbacks always see the latest values without resubscribing
    const activeRef = useRef(activeFriendId);
    const myIdRef = useRef(myId);
    activeRef.current = activeFriendId;
    myIdRef.current = myId;

    const api = useCallback(
        (path: string, init: RequestInit = {}) =>
            fetch(`${API_URL}${path}`, {
                ...init,
                headers: {
                    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
                    ...init.headers,
                    Authorization: `Bearer ${token}`,
                },
            }),
        [token]
    );

    useEffect(() => {
        if (loading || !token) return;
        let cancelled = false;
        (async () => {
            try {
                const [profileRes, convRes] = await Promise.all([
                    api('/api/user'),
                    api('/api/message/conversations'),
                ]);
                const profile = await profileRes.json();
                const conv = await convRes.json();
                if (cancelled) return;
                setProfilePic(profile?.user?.avatarUrl ?? null);
                setMyId(conv.me ?? profile?.user?.id ?? null);
                setInboxTopic(conv.inboxTopic ?? null);
                setConversations(conv.conversations ?? []);
            } catch (err) {
                console.error(err);
            } finally {
                if (!cancelled) setListLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [loading, token, api]);

    const applyMessage = useCallback((msg: Message) => {
        const me = myIdRef.current;
        setConversations((prev) => {
            const friendId = msg.senderId === me ? msg.receiverId : msg.senderId;
            const idx = prev.findIndex((c) => c.friend.id === friendId);
            if (idx < 0) return prev;
            const c = prev[idx];
            const last = c.lastMessage;
            if (last && (last.id === msg.id || new Date(last.createdAt) > new Date(msg.createdAt))) return prev;

            const incoming = msg.senderId === friendId;
            const unreadCount = incoming && activeRef.current !== friendId ? c.unreadCount + 1 : c.unreadCount;
            return [{ ...c, lastMessage: msg, unreadCount }, ...prev.filter((_, i) => i !== idx)];
        });
    }, []);

    const clearUnread = useCallback((friendId: string) => {
        setConversations((prev) =>
            prev.map((c) => (c.friend.id === friendId && c.unreadCount > 0 ? { ...c, unreadCount: 0 } : c))
        );
    }, []);

    // Personal inbox channel keeps the sidebar live (new messages from any friend)
    useEffect(() => {
        if (!inboxTopic) return;
        const channel = supabase
            .channel(inboxTopic)
            .on('broadcast', { event: 'message' }, ({ payload }) => applyMessage(payload as Message))
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [inboxTopic, applyMessage]);

    const ctx = useMemo<ChatContextValue | null>(
        () =>
            token && myId ? { token, myId, conversations, applyMessage, clearUnread, api } : null,
        [token, myId, conversations, applyMessage, clearUnread, api]
    );

    if (loading) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-slate-100">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="flex h-dvh flex-col bg-slate-100 text-slate-900">
            <NavBar profilePic={profilePic} />
            <main className="flex min-h-0 flex-1 justify-center md:p-6">
                <div className="flex w-full max-w-6xl overflow-hidden bg-white md:rounded-2xl md:shadow-xl md:ring-1 md:ring-slate-200">
                    <aside
                        className={`${activeFriendId ? 'hidden md:flex' : 'flex'} w-full flex-col border-slate-200 md:w-80 md:border-r lg:w-96`}
                    >
                        <ConversationList
                            conversations={conversations}
                            loading={listLoading}
                            myId={myId}
                            activeFriendId={activeFriendId}
                        />
                    </aside>
                    <section className={`${activeFriendId ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`}>
                        {ctx ? (
                            <ChatContext.Provider value={ctx}>{children}</ChatContext.Provider>
                        ) : (
                            <div className="flex flex-1 items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
