'use client'
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import NavBar from '@/components/NavBar';
import UserAvatar from '@/components/chat/UserAvatar';
import { displayName } from '@/components/chat/format';
import { useAuth } from '@/lib/useAuth';

type Contact = {
    id: string;
    displayName: string | null;
    avatarUrl: string | null;
};

type PendingRequest = {
    id: string;
    requesterId: string;
    addresseeId: string;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
    createdAt: string;
    updatedAt: string;
    requester: Contact;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const btnBase = 'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition disabled:cursor-not-allowed';
const btnPrimary = `${btnBase} bg-primary text-white hover:bg-primary-hover disabled:opacity-60`;
const btnSoft = `${btnBase} bg-primary-soft text-accent hover:brightness-95 dark:hover:brightness-125`;
const btnMuted = `${btnBase} bg-surface-2 text-muted`;

export default function Contacts() {
    const { token, loading } = useAuth();
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [friendIds, setFriendIds] = useState<Set<string>>(new Set());
    const [sentIds, setSentIds] = useState<Set<string>>(new Set());
    const [pending, setPending] = useState<PendingRequest[]>([]);
    const [busy, setBusy] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [dataLoading, setDataLoading] = useState(true);

    useEffect(() => {
        if (loading || !token) return;
        const headers = { Authorization: `Bearer ${token}` };
        (async () => {
            try {
                const [profileRes, listRes, friendsRes, requestsRes] = await Promise.all([
                    fetch(`${API_URL}/api/user`, { headers }),
                    fetch(`${API_URL}/api/user/list`, { headers }),
                    fetch(`${API_URL}/api/friend`, { headers }),
                    fetch(`${API_URL}/api/friend/requests`, { headers }),
                ]);
                const [profileData, listData, friendsData, requestsData] = await Promise.all([
                    profileRes.json(),
                    listRes.json(),
                    friendsRes.json(),
                    requestsRes.json(),
                ]);
                setProfilePic(profileData?.user?.avatarUrl ?? null);
                setContacts(listData.users ?? []);
                setFriendIds(new Set((friendsData.friends ?? []).map((f: Contact) => f.id)));
                setPending(requestsData.requests ?? []);
            } catch (err) {
                console.error(err);
            } finally {
                setDataLoading(false);
            }
        })();
    }, [loading, token]);

    async function handleAdd(addresseeId: string) {
        if (!token) return;
        setBusy(addresseeId);
        try {
            const res = await fetch(`${API_URL}/api/friend/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ addresseeId }),
            });
            if (res.ok || res.status === 409) setSentIds((prev) => new Set(prev).add(addresseeId));
        } finally {
            setBusy(null);
        }
    }

    async function handleAccept(requesterId: string) {
        if (!token) return;
        setBusy(requesterId);
        try {
            const res = await fetch(`${API_URL}/api/friend/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ requesterId }),
            });
            if (res.ok) {
                setPending((prev) => prev.filter((r) => r.requesterId !== requesterId));
                setFriendIds((prev) => new Set(prev).add(requesterId));
            }
        } finally {
            setBusy(null);
        }
    }

    const incomingIds = useMemo(() => new Set(pending.map((r) => r.requesterId)), [pending]);
    const q = query.trim().toLowerCase();
    const filtered = contacts.filter((c) => displayName(c).toLowerCase().includes(q));

    function action(contact: Contact) {
        if (friendIds.has(contact.id)) {
            return (
                <Link href={`/Chat/${contact.id}`} className={btnSoft}>
                    <ChatBubbleRoundedIcon sx={{ fontSize: 16 }} />
                    Message
                </Link>
            );
        }
        if (incomingIds.has(contact.id)) {
            return (
                <button type="button" disabled={busy === contact.id} onClick={() => handleAccept(contact.id)} className={btnPrimary}>
                    <CheckRoundedIcon sx={{ fontSize: 16 }} />
                    Accept
                </button>
            );
        }
        if (sentIds.has(contact.id)) {
            return (
                <span className={btnMuted}>
                    <ScheduleRoundedIcon sx={{ fontSize: 16 }} />
                    Requested
                </span>
            );
        }
        return (
            <button type="button" disabled={busy === contact.id} onClick={() => handleAdd(contact.id)} className={btnPrimary}>
                <PersonAddAlt1RoundedIcon sx={{ fontSize: 16 }} />
                Add
            </button>
        );
    }

    if (loading) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-bg">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-dvh bg-bg">
            <NavBar profilePic={profilePic} />

            <main className="mx-auto flex max-w-2xl flex-col gap-4 px-3 py-6 sm:px-4">
                <div>
                    <h1 className="text-2xl font-semibold text-fg">People</h1>
                    <p className="mt-1 text-sm text-muted">Add friends to see them in Chats.</p>
                </div>

                {pending.length > 0 && (
                    <section className="rounded-2xl border border-line bg-surface p-2 shadow-sm">
                        <h2 className="flex items-center gap-2 px-3 pt-2 pb-1 text-sm font-semibold text-fg">
                            Friend requests
                            <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">
                                {pending.length}
                            </span>
                        </h2>
                        <ul>
                            {pending.map((r) => (
                                <li key={r.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                                    <UserAvatar user={r.requester} size={44} />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium text-fg">{displayName(r.requester)}</p>
                                        <p className="text-xs text-muted">wants to be your friend</p>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={busy === r.requesterId}
                                        onClick={() => handleAccept(r.requesterId)}
                                        className={btnPrimary}
                                    >
                                        Accept
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <section className="rounded-2xl border border-line bg-surface p-2 shadow-sm">
                    <div className="p-2">
                        <label className="flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2.5 text-subtle focus-within:ring-2 focus-within:ring-primary/40">
                            <SearchIcon fontSize="small" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search people"
                                className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-subtle"
                            />
                        </label>
                    </div>

                    {dataLoading ? (
                        <ul>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <li key={i} className="flex items-center gap-3 px-3 py-2.5">
                                    <div className="h-11 w-11 animate-pulse rounded-full bg-surface-2" />
                                    <div className="h-3 w-40 animate-pulse rounded bg-surface-2" />
                                </li>
                            ))}
                        </ul>
                    ) : filtered.length === 0 ? (
                        <p className="px-4 py-10 text-center text-sm text-muted">
                            {contacts.length === 0 ? 'No other users yet.' : `No one matches "${query}".`}
                        </p>
                    ) : (
                        <ul>
                            {filtered.map((contact) => (
                                <li
                                    key={contact.id}
                                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-surface-2"
                                >
                                    <UserAvatar user={contact} size={44} />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-medium text-fg">{displayName(contact)}</p>
                                        {friendIds.has(contact.id) && <p className="text-xs text-muted">Friend</p>}
                                    </div>
                                    {action(contact)}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </main>
        </div>
    );
}
