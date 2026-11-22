'use client'
import { useEffect, useState } from 'react';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import NavBar from '@/components/NavBar';
import UserAvatar from '@/components/chat/UserAvatar';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { ThemeSelector } from '@/lib/theme';

type UserProfile = {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const inputCls =
    'h-11 w-full rounded-xl border border-line bg-surface-2 px-4 text-[15px] text-fg outline-none transition placeholder:text-subtle focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-70';

export default function Profile() {
    const { token, loading } = useAuth();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (loading || !token) return;
        (async () => {
            const res = await fetch(`${API_URL}/api/user`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setUser(data.user);
            setDisplayName(data.user?.displayName ?? '');
        })();
    }, [loading, token]);

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!token || !user) return;
        setSaving(true);
        setNotice(null);

        let avatarUrl = user.avatarUrl;

        if (file) {
            const ext = file.name.split('.').pop();
            const filePath = `${user.id}.${ext}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });

            if (!uploadError) {
                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
                avatarUrl = urlData.publicUrl;
            } else {
                console.error(uploadError);
                setNotice({ type: 'error', text: 'Could not upload the photo.' });
            }
        }

        const res = await fetch(`${API_URL}/api/user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ displayName, avatarUrl }),
        });

        if (res.ok) {
            const { user: updated } = await res.json();
            setUser(updated);
            setFile(null);
            setPreview(null);
            setNotice((n) => n ?? { type: 'ok', text: 'Profile saved.' });
        } else {
            setNotice({ type: 'error', text: 'Could not save your profile.' });
        }

        setSaving(false);
    }

    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] ?? null;
        setFile(f);
        setPreview(f ? URL.createObjectURL(f) : null);
    }

    if (loading) {
        return (
            <div className="flex min-h-dvh items-center justify-center bg-bg">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    const dirty = !!file || displayName !== (user?.displayName ?? '');

    return (
        <div className="min-h-dvh bg-bg">
            <NavBar profilePic={user?.avatarUrl} />

            <main className="mx-auto flex max-w-xl flex-col gap-4 px-3 py-6 sm:px-4">
                <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
                    <div className="h-24 bg-gradient-to-br from-primary via-primary-hover to-brand-deep" />
                    <div className="px-6 pb-6">
                        <div className="-mt-12 flex items-end justify-between">
                            <div className="relative">
                                <div className="rounded-full ring-4 ring-surface">
                                    {preview ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={preview} alt="New profile photo" className="h-24 w-24 rounded-full object-cover" />
                                    ) : (
                                        <UserAvatar user={user} size={96} />
                                    )}
                                </div>
                                <label
                                    htmlFor="profilePic"
                                    title="Change photo"
                                    className="absolute right-0 bottom-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-white ring-4 ring-surface transition hover:bg-primary-hover"
                                >
                                    <PhotoCameraRoundedIcon sx={{ fontSize: 16 }} />
                                </label>
                                <input id="profilePic" type="file" accept="image/*" className="hidden" onChange={handleFile} />
                            </div>
                        </div>
                        <h1 className="mt-3 text-xl font-semibold text-fg">{user?.displayName || 'Your profile'}</h1>
                        <p className="text-sm text-muted">{user?.email}</p>

                        <form onSubmit={handleSave} className="mt-6 flex flex-col gap-4">
                            <div>
                                <label htmlFor="displayName" className="mb-1.5 block text-sm font-medium text-fg">
                                    Display name
                                </label>
                                <input
                                    id="displayName"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className={inputCls}
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-fg">
                                    Email
                                </label>
                                <input id="email" value={user?.email ?? ''} disabled className={inputCls} />
                            </div>

                            {notice && (
                                <p
                                    role="status"
                                    className={`rounded-xl px-4 py-2.5 text-sm ${
                                        notice.type === 'ok' ? 'bg-success/10 text-success' : 'bg-danger-soft text-danger'
                                    }`}
                                >
                                    {notice.text}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={saving || !dirty}
                                className="flex h-11 items-center justify-center rounded-xl bg-primary font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving ? 'Saving…' : 'Save changes'}
                            </button>
                        </form>
                    </div>
                </section>

                <section className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
                    <h2 className="font-semibold text-fg">Appearance</h2>
                    <p className="mt-1 mb-4 text-sm text-muted">Choose how Social Media looks to you.</p>
                    <ThemeSelector />
                </section>
            </main>
        </div>
    );
}
