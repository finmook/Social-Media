'use client'
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { RealtimeChannel } from '@supabase/supabase-js';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { supabase } from '@/lib/supabase';
import { useChat } from './ChatContext';
import UserAvatar from './UserAvatar';
import { displayName, formatDayLabel, formatTime, isSameDay } from './format';
import type { ChatUser, Message } from './types';

const MAX_LENGTH = 2000;
const GROUP_GAP_MS = 5 * 60 * 1000;
const TYPING_SEND_INTERVAL_MS = 2000;
const TYPING_TIMEOUT_MS = 3500;

function byCreatedAt(a: Message, b: Message) {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

function mergeMessage(list: Message[], msg: Message, replaceId?: string) {
    const rest = list.filter((m) => m.id !== msg.id && m.id !== replaceId);
    return [...rest, msg].sort(byCreatedAt);
}

export default function ConversationView({ friendId }: { friendId: string }) {
    const { myId, conversations, applyMessage, clearUnread, api } = useChat();

    const fromList = conversations.find((c) => c.friend.id === friendId)?.friend ?? null;
    const [friend, setFriend] = useState<ChatUser | null>(fromList);
    const [messages, setMessages] = useState<Message[]>([]);
    const [hasMore, setHasMore] = useState(false);
    const [topic, setTopic] = useState<string | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'forbidden' | 'error'>('loading');
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [text, setText] = useState('');
    const [friendTyping, setFriendTyping] = useState(false);
    const [friendOnline, setFriendOnline] = useState(false);
    const [showJump, setShowJump] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const lastTypingSentRef = useRef(0);
    const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Scroll bookkeeping: 'bottom' = stick to bottom, number = restore after prepending older messages
    const scrollIntentRef = useRef<'bottom' | 'smooth' | { prevHeight: number } | null>('bottom');

    // ---- Read receipts -----------------------------------------------------
    const markRead = useCallback(async () => {
        if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
        clearUnread(friendId);
        try {
            await api(`/api/message/${friendId}/read`, { method: 'POST' });
        } catch {
            /* non-critical */
        }
    }, [api, clearUnread, friendId]);

    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') markRead();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [markRead]);

    // ---- Initial load --------------------------------------------------------
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await api(`/api/message/${friendId}`);
                if (cancelled) return;
                if (res.status === 403) return setStatus('forbidden');
                if (!res.ok) return setStatus('error');
                const data = await res.json();
                if (cancelled) return;
                setFriend(data.friend);
                setMessages(data.messages ?? []);
                setHasMore(!!data.hasMore);
                setTopic(data.topic);
                scrollIntentRef.current = 'bottom';
                setStatus('ready');
                markRead();
            } catch {
                if (!cancelled) setStatus('error');
            }
        })();
        return () => {
            cancelled = true;
        };
        // markRead is stable for a given friendId; don't refetch when it changes identity
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api, friendId]);

    // ---- Realtime: messages, read receipts, typing, presence -----------------
    useEffect(() => {
        if (!topic) return;
        const channel = supabase.channel(topic, {
            config: { broadcast: { self: false }, presence: { key: myId } },
        });
        channelRef.current = channel;

        channel
            .on('broadcast', { event: 'message' }, ({ payload }) => {
                const msg = payload as Message;
                const atBottom = isNearBottom();
                setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : mergeMessage(prev, msg)));
                applyMessage(msg);
                if (msg.senderId === friendId) {
                    setFriendTyping(false);
                    if (atBottom) scrollIntentRef.current = 'smooth';
                    markRead();
                }
            })
            .on('broadcast', { event: 'read' }, ({ payload }) => {
                const { readerId, readAt } = payload as { readerId: string; readAt: string };
                if (readerId !== friendId) return;
                const cutoff = new Date(readAt).getTime();
                setMessages((prev) =>
                    prev.map((m) =>
                        m.senderId === myId && !m.readAt && !m.status && new Date(m.createdAt).getTime() <= cutoff
                            ? { ...m, readAt }
                            : m
                    )
                );
            })
            .on('broadcast', { event: 'typing' }, ({ payload }) => {
                if ((payload as { userId: string }).userId !== friendId) return;
                const atBottom = isNearBottom();
                setFriendTyping(true);
                if (atBottom) scrollIntentRef.current = 'smooth';
                if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
                typingTimerRef.current = setTimeout(() => setFriendTyping(false), TYPING_TIMEOUT_MS);
            })
            .on('presence', { event: 'sync' }, () => {
                setFriendOnline(Object.keys(channel.presenceState()).includes(friendId));
            })
            .subscribe(async (state) => {
                if (state === 'SUBSCRIBED') await channel.track({ onlineAt: new Date().toISOString() });
            });

        return () => {
            channelRef.current = null;
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            supabase.removeChannel(channel);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topic, myId, friendId]);

    // ---- Scrolling -------------------------------------------------------------
    function isNearBottom() {
        const el = scrollRef.current;
        if (!el) return true;
        return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    }

    useLayoutEffect(() => {
        const el = scrollRef.current;
        const intent = scrollIntentRef.current;
        if (!el || !intent) return;
        if (intent === 'bottom') el.scrollTop = el.scrollHeight;
        else if (intent === 'smooth') el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        else el.scrollTop = el.scrollHeight - intent.prevHeight;
        scrollIntentRef.current = null;
    }, [messages, friendTyping, status]);

    function onScroll() {
        const el = scrollRef.current;
        if (!el) return;
        setShowJump(!isNearBottom());
        if (el.scrollTop < 80 && hasMore && !loadingOlder) loadOlder();
    }

    async function loadOlder() {
        const oldest = messages.find((m) => !m.status);
        if (!oldest || loadingOlder) return;
        setLoadingOlder(true);
        try {
            const res = await api(`/api/message/${friendId}?before=${encodeURIComponent(oldest.createdAt)}`);
            if (!res.ok) return;
            const data = await res.json();
            scrollIntentRef.current = { prevHeight: scrollRef.current?.scrollHeight ?? 0 };
            setMessages((prev) => {
                const known = new Set(prev.map((m) => m.id));
                return [...(data.messages as Message[]).filter((m) => !known.has(m.id)), ...prev];
            });
            setHasMore(!!data.hasMore);
        } finally {
            setLoadingOlder(false);
        }
    }

    // ---- Sending ---------------------------------------------------------------
    async function send(content: string, replaceId?: string) {
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const optimistic: Message = {
            id: tempId,
            senderId: myId,
            receiverId: friendId,
            content,
            readAt: null,
            createdAt: new Date().toISOString(),
            status: 'sending',
        };
        scrollIntentRef.current = 'smooth';
        setMessages((prev) => mergeMessage(prev, optimistic, replaceId));

        try {
            const res = await api('/api/message', {
                method: 'POST',
                body: JSON.stringify({ receiverId: friendId, content }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const { message } = (await res.json()) as { message: Message };
            setMessages((prev) => mergeMessage(prev, message, tempId));
            applyMessage(message);
        } catch (err) {
            console.error(err);
            setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m)));
        }
    }

    function handleSubmit(e?: React.FormEvent) {
        e?.preventDefault();
        const content = text.trim();
        if (!content) return;
        setText('');
        lastTypingSentRef.current = 0;
        send(content);
        inputRef.current?.focus();
    }

    function handleChange(value: string) {
        setText(value);
        const now = Date.now();
        if (value.trim() && channelRef.current && now - lastTypingSentRef.current > TYPING_SEND_INTERVAL_MS) {
            lastTypingSentRef.current = now;
            channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { userId: myId } });
        }
    }

    // Auto-grow the textarea
    useLayoutEffect(() => {
        const el = inputRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    }, [text]);

    // ---- Render ----------------------------------------------------------------
    const name = displayName(friend);
    const lastMine = [...messages].reverse().find((m) => m.senderId === myId);
    const subtitle = friendTyping ? 'typing…' : friendOnline ? 'Active now' : null;

    if (status === 'forbidden' || status === 'error') {
        return (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <p className="font-medium text-slate-800">
                    {status === 'forbidden' ? 'You can only message friends.' : 'Could not load this conversation.'}
                </p>
                <Link href="/Chat" className="mt-3 text-sm font-medium text-blue-600 hover:underline">
                    Back to chats
                </Link>
            </div>
        );
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            {/* Header */}
            <header className="flex items-center gap-3 border-b border-slate-200 px-3 py-2.5 sm:px-5">
                <Link
                    href="/Chat"
                    aria-label="Back to chats"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50 md:hidden"
                >
                    <ArrowBackIosNewRoundedIcon fontSize="small" />
                </Link>
                <UserAvatar user={friend} size={42} online={friendOnline} />
                <div className="min-w-0">
                    <h2 className="truncate font-semibold text-slate-900">{friend ? name : ' '}</h2>
                    <p className={`h-4 text-xs ${friendTyping ? 'text-blue-600' : 'text-slate-500'}`}>{subtitle}</p>
                </div>
            </header>

            {/* Messages */}
            <div className="relative min-h-0 flex-1">
                <div
                    ref={scrollRef}
                    onScroll={onScroll}
                    className="h-full overflow-y-auto bg-gradient-to-b from-white to-blue-50/40 px-3 py-4 sm:px-6"
                >
                    {status === 'loading' ? (
                        <div className="flex h-full items-center justify-center">
                            <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                        </div>
                    ) : (
                        <>
                            {loadingOlder && (
                                <div className="flex justify-center py-2">
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                </div>
                            )}

                            {!hasMore && (
                                <div className="flex flex-col items-center pt-6 pb-8 text-center">
                                    <UserAvatar user={friend} size={72} />
                                    <p className="mt-3 font-semibold text-slate-900">{name}</p>
                                    <p className="text-sm text-slate-500">
                                        {messages.length === 0
                                            ? `You're friends now. Say hi to ${name}!`
                                            : 'This is the beginning of your conversation.'}
                                    </p>
                                    {messages.length === 0 && (
                                        <button
                                            type="button"
                                            onClick={() => send('👋')}
                                            className="mt-4 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
                                        >
                                            👋 Wave
                                        </button>
                                    )}
                                </div>
                            )}

                            <ol className="flex flex-col">
                                {messages.map((m, i) => {
                                    const prev = messages[i - 1];
                                    const next = messages[i + 1];
                                    const mine = m.senderId === myId;
                                    const newDay = !prev || !isSameDay(prev.createdAt, m.createdAt);
                                    const joinPrev =
                                        !!prev &&
                                        !newDay &&
                                        prev.senderId === m.senderId &&
                                        new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < GROUP_GAP_MS;
                                    const joinNext =
                                        !!next &&
                                        isSameDay(m.createdAt, next.createdAt) &&
                                        next.senderId === m.senderId &&
                                        new Date(next.createdAt).getTime() - new Date(m.createdAt).getTime() < GROUP_GAP_MS;

                                    const corners = mine
                                        ? `${joinPrev ? 'rounded-tr-md' : ''} ${joinNext ? 'rounded-br-md' : ''}`
                                        : `${joinPrev ? 'rounded-tl-md' : ''} ${joinNext ? 'rounded-bl-md' : ''}`;

                                    return (
                                        <Fragment key={m.id}>
                                            {newDay && (
                                                <li className="my-4 flex items-center gap-3 text-xs font-medium text-slate-400">
                                                    <span className="h-px flex-1 bg-slate-200" />
                                                    {formatDayLabel(m.createdAt)}
                                                    <span className="h-px flex-1 bg-slate-200" />
                                                </li>
                                            )}
                                            <li
                                                className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'} ${
                                                    joinPrev ? 'mt-0.5' : 'mt-3'
                                                }`}
                                            >
                                                {!mine && (
                                                    <div className="w-7 shrink-0">
                                                        {!joinNext && <UserAvatar user={friend} size={28} />}
                                                    </div>
                                                )}
                                                <div className={`flex max-w-[78%] flex-col sm:max-w-[65%] ${mine ? 'items-end' : 'items-start'}`}>
                                                    <div
                                                        title={formatTime(m.createdAt)}
                                                        className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px] leading-snug ${corners} ${
                                                            !mine
                                                                ? 'bg-white text-slate-900 ring-1 ring-slate-200'
                                                                : m.status === 'failed'
                                                                  ? 'bg-red-500 text-white'
                                                                  : 'bg-blue-500 text-white shadow-sm shadow-blue-500/20'
                                                        } ${m.status === 'sending' ? 'opacity-70' : ''}`}
                                                    >
                                                        {m.content}
                                                    </div>
                                                    {!joinNext && (
                                                        <span className="mt-1 px-1 text-[11px] text-slate-400">
                                                            {m.status === 'sending' ? (
                                                                'Sending…'
                                                            ) : m.status === 'failed' ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => send(m.content, m.id)}
                                                                    className="font-medium text-red-500 hover:underline"
                                                                >
                                                                    Not sent · Tap to retry
                                                                </button>
                                                            ) : (
                                                                <>
                                                                    {formatTime(m.createdAt)}
                                                                    {mine && m.id === lastMine?.id && m.readAt && ' · Seen'}
                                                                </>
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </li>
                                        </Fragment>
                                    );
                                })}

                                {friendTyping && (
                                    <li className="mt-3 flex items-end gap-2">
                                        <UserAvatar user={friend} size={28} />
                                        <div className="flex gap-1 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200" aria-label={`${name} is typing`}>
                                            {[0, 150, 300].map((delay) => (
                                                <span
                                                    key={delay}
                                                    className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                                                    style={{ animationDelay: `${delay}ms` }}
                                                />
                                            ))}
                                        </div>
                                    </li>
                                )}
                            </ol>
                        </>
                    )}
                </div>

                {showJump && (
                    <button
                        type="button"
                        aria-label="Jump to latest"
                        onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })}
                        className="absolute bottom-4 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-white text-blue-600 shadow-lg ring-1 ring-slate-200 transition hover:bg-blue-50"
                    >
                        <KeyboardArrowDownRoundedIcon />
                    </button>
                )}
            </div>

            {/* Composer */}
            <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-slate-200 bg-white px-3 py-3 sm:px-5">
                <div className="flex min-w-0 flex-1 items-end rounded-3xl bg-slate-100 px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500/40">
                    <textarea
                        ref={inputRef}
                        value={text}
                        rows={1}
                        maxLength={MAX_LENGTH}
                        disabled={status !== 'ready'}
                        onChange={(e) => handleChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                        placeholder={`Message ${friend ? name : ''}`}
                        aria-label="Message"
                        className="max-h-[140px] w-full resize-none bg-transparent py-1 text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
                    />
                </div>
                <button
                    type="submit"
                    aria-label="Send"
                    disabled={!text.trim() || status !== 'ready'}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white shadow-md shadow-blue-500/30 transition hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                    <SendRoundedIcon fontSize="small" />
                </button>
            </form>
        </div>
    );
}
