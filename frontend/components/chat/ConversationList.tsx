'use client'
import { useState } from 'react';
import Link from 'next/link';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import UserAvatar from './UserAvatar';
import { displayName, formatListTime } from './format';
import type { Conversation } from './types';

type Props = {
    conversations: Conversation[];
    loading: boolean;
    myId: string | null;
    activeFriendId?: string;
};

export default function ConversationList({ conversations, loading, myId, activeFriendId }: Props) {
    const [query, setQuery] = useState('');
    const q = query.trim().toLowerCase();
    const filtered = q
        ? conversations.filter((c) => displayName(c.friend).toLowerCase().includes(q))
        : conversations;

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="text-2xl font-semibold text-slate-900">Chats</h2>
                <Link
                    href="/Contacts"
                    title="Find friends"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-blue-50 hover:text-blue-600"
                >
                    <PersonAddAlt1Icon fontSize="small" />
                </Link>
            </div>

            <div className="px-4 pb-3">
                <label className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-slate-500 focus-within:ring-2 focus-within:ring-blue-500/40">
                    <SearchIcon fontSize="small" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search friends"
                        className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                </label>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
                {loading ? (
                    <ul>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <li key={i} className="flex items-center gap-3 px-3 py-3">
                                <div className="h-12 w-12 animate-pulse rounded-full bg-slate-200" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
                                    <div className="h-3 w-3/4 animate-pulse rounded bg-slate-100" />
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center px-6 py-12 text-center">
                        <p className="font-medium text-slate-800">No friends yet</p>
                        <p className="mt-1 text-sm text-slate-500">Add friends to start chatting.</p>
                        <Link
                            href="/Contacts"
                            className="mt-4 rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
                        >
                            Find friends
                        </Link>
                    </div>
                ) : filtered.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-500">No friends match “{query}”.</p>
                ) : (
                    <ul className="space-y-0.5">
                        {filtered.map((c) => {
                            const active = c.friend.id === activeFriendId;
                            const unread = c.unreadCount > 0 && !active;
                            const last = c.lastMessage;
                            const preview = last
                                ? `${last.senderId === myId ? 'You: ' : ''}${last.content}`
                                : 'Say hi 👋';
                            return (
                                <li key={c.friend.id}>
                                    <Link
                                        href={`/Chat/${c.friend.id}`}
                                        aria-current={active ? 'page' : undefined}
                                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                                            active ? 'bg-blue-50' : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        <UserAvatar user={c.friend} size={48} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-baseline justify-between gap-2">
                                                <span
                                                    className={`truncate ${
                                                        unread ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'
                                                    }`}
                                                >
                                                    {displayName(c.friend)}
                                                </span>
                                                {last && (
                                                    <span
                                                        className={`shrink-0 text-xs ${
                                                            unread ? 'font-semibold text-blue-600' : 'text-slate-400'
                                                        }`}
                                                    >
                                                        {formatListTime(last.createdAt)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span
                                                    className={`truncate text-sm ${
                                                        unread ? 'font-medium text-slate-900' : 'text-slate-500'
                                                    }`}
                                                >
                                                    {preview}
                                                </span>
                                                {unread && (
                                                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 px-1.5 text-[11px] font-semibold text-white">
                                                        {c.unreadCount > 99 ? '99+' : c.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </nav>
        </div>
    );
}
