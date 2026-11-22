'use client'
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import DynamicFeedRoundedIcon from '@mui/icons-material/DynamicFeedRounded';
import NavBar from '@/components/NavBar';
import UserAvatar from '@/components/chat/UserAvatar';
import { displayName, timeAgo } from '@/components/chat/format';
import { joinChannel } from '@/lib/realtimeChannel';
import { useAuth } from '@/lib/useAuth';

type PostItem = {
    id: string;
    content: string;
    images: string[];
    createdAt?: string;
    author: { displayName: string | null; avatarUrl: string | null };
};

type Me = { id: string; displayName: string | null; avatarUrl: string | null };

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const MAX_POST = 1000;

export default function Feed() {
    const { token, loading } = useAuth();
    const [me, setMe] = useState<Me | null>(null);
    const [posts, setPosts] = useState<PostItem[]>([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [text, setText] = useState('');
    const [posting, setPosting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [, setTick] = useState(0);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (loading || !token) return;
        const headers = { Authorization: `Bearer ${token}` };

        (async () => {
            try {
                const [userRes, postsRes] = await Promise.all([
                    fetch(`${API_URL}/api/user`, { headers }),
                    fetch(`${API_URL}/api/post`, { headers }),
                ]);
                const userData = await userRes.json();
                const postsData = await postsRes.json();
                setMe(userData?.user ?? null);
                setPosts(postsData.posts ?? []);
            } catch (err) {
                console.error(err);
            } finally {
                setPostsLoading(false);
            }
        })();

        // New posts arrive via Supabase Broadcast sent by the backend (no DB replication needed)
        const sub = joinChannel('feed', {
            onBroadcast: (event, payload) => {
                if (event === 'post') addPost(payload as PostItem);
            },
        });
        return () => sub.leave();
    }, [loading, token]);

    function addPost(post: PostItem) {
        setPosts((prev) => (prev.some((p) => p.id === post.id) ? prev : [post, ...prev]));
    }

    // Refresh relative timestamps every minute
    useEffect(() => {
        const t = setInterval(() => setTick((n) => n + 1), 60_000);
        return () => clearInterval(t);
    }, []);

    useLayoutEffect(() => {
        const el = inputRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
    }, [text]);

    async function createPost(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const content = text.trim();
        if (!content || !token) return;
        setPosting(true);
        setError(null);
        try {
            const res = await fetch(`${API_URL}/api/post`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.error ?? 'Could not publish your post.');
            } else {
                const { post } = await res.json();
                if (post) addPost(post);
                setText('');
            }
        } catch {
            setError('Could not publish your post.');
        } finally {
            setPosting(false);
        }
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
            <NavBar profilePic={me?.avatarUrl} />

            <main className="mx-auto flex max-w-2xl flex-col gap-4 px-3 py-6 sm:px-4">
                {/* Composer */}
                <form onSubmit={createPost} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
                    <div className="flex gap-3">
                        <UserAvatar user={me} size={42} />
                        <textarea
                            ref={inputRef}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
                            }}
                            rows={2}
                            maxLength={MAX_POST}
                            placeholder={`What's on your mind${me?.displayName ? `, ${me.displayName.split(' ')[0]}` : ''}?`}
                            className="min-h-[52px] flex-1 resize-none bg-transparent py-2 text-[15px] text-fg outline-none placeholder:text-subtle"
                        />
                    </div>
                    {error && <p className="mt-2 text-sm text-danger">{error}</p>}
                    <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                        <span className={`text-xs ${text.length > MAX_POST - 100 ? 'text-danger' : 'text-subtle'}`}>
                            {text.length > 0 ? `${text.length}/${MAX_POST}` : ''}
                        </span>
                        <button
                            type="submit"
                            disabled={!text.trim() || posting}
                            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-subtle"
                        >
                            {posting ? 'Posting…' : 'Post'}
                        </button>
                    </div>
                </form>

                {/* Posts */}
                {postsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="rounded-2xl border border-line bg-surface p-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 animate-pulse rounded-full bg-surface-2" />
                                <div className="space-y-2">
                                    <div className="h-3 w-32 animate-pulse rounded bg-surface-2" />
                                    <div className="h-3 w-16 animate-pulse rounded bg-surface-2" />
                                </div>
                            </div>
                            <div className="mt-4 space-y-2">
                                <div className="h-3 w-full animate-pulse rounded bg-surface-2" />
                                <div className="h-3 w-2/3 animate-pulse rounded bg-surface-2" />
                            </div>
                        </div>
                    ))
                ) : posts.length === 0 ? (
                    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-accent">
                            <DynamicFeedRoundedIcon />
                        </span>
                        <p className="mt-4 font-medium text-fg">No posts yet</p>
                        <p className="mt-1 text-sm text-muted">Be the first to share something.</p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <article key={post.id} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
                            <header className="flex items-center gap-3">
                                <UserAvatar user={{ id: post.id, ...post.author }} size={42} />
                                <div className="min-w-0">
                                    <p className="truncate font-medium text-fg">{displayName(post.author)}</p>
                                    {post.createdAt && (
                                        <time
                                            dateTime={post.createdAt}
                                            title={new Date(post.createdAt).toLocaleString()}
                                            className="text-xs text-subtle"
                                        >
                                            {timeAgo(post.createdAt)}
                                        </time>
                                    )}
                                </div>
                            </header>
                            <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-fg">
                                {post.content}
                            </p>
                            {post.images?.length > 0 && (
                                <div className={`mt-3 grid gap-2 ${post.images.length > 1 ? 'grid-cols-2' : ''}`}>
                                    {post.images.map((src) => (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            key={src}
                                            src={src}
                                            alt=""
                                            className="max-h-96 w-full rounded-xl border border-line object-cover"
                                        />
                                    ))}
                                </div>
                            )}
                        </article>
                    ))
                )}
            </main>
        </div>
    );
}
