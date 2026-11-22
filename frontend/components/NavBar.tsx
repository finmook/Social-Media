"use client"
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar } from '@mui/material';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { supabase } from '@/lib/supabase';
import { ThemeToggleButton } from '@/lib/theme';

type Props = {
  profilePic?: string | null;
};

const links = [
  { href: '/Feed', label: 'Feed', Icon: HomeRoundedIcon },
  { href: '/Contacts', label: 'Contacts', Icon: PeopleAltRoundedIcon },
  { href: '/Chat', label: 'Chats', Icon: ChatBubbleRoundedIcon },
];

export default function NavBar({ profilePic }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [cacheBust] = useState(() => Date.now());
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  async function handleLogOut() {
    setMenuOpen(false);
    const { error } = await supabase.auth.signOut();
    if (error) console.error(error);
    router.push('/');
  }

  const avatarSrc = profilePic ? `${profilePic}?ts=${cacheBust}` : undefined;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:px-6">
        <Link href="/Feed" className="flex items-center gap-2 font-semibold text-fg">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <ForumRoundedIcon sx={{ fontSize: 18 }} />
          </span>
          <span className="hidden sm:inline">Social Media</span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
                className={`flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium transition ${
                  active ? 'bg-primary-soft text-accent' : 'text-muted hover:bg-surface-2 hover:text-fg'
                }`}
              >
                <Icon sx={{ fontSize: 20 }} />
                <span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggleButton />
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-full ring-primary/40 transition hover:ring-2 focus-visible:ring-2 focus-visible:outline-none"
            >
              <Avatar src={avatarSrc} sx={{ width: 32, height: 32, bgcolor: 'var(--primary)' }} />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-xl shadow-black/10"
              >
                <Link
                  href="/Profile"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-fg hover:bg-surface-2"
                >
                  <PersonRoundedIcon sx={{ fontSize: 20 }} className="text-muted" />
                  Profile
                </Link>
                <div className="my-1 h-px bg-line" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogOut}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-surface-2"
                >
                  <LogoutRoundedIcon sx={{ fontSize: 20 }} />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
