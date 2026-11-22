import Link from 'next/link';
import { ThemeToggleButton } from '@/lib/theme';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import DynamicFeedRoundedIcon from '@mui/icons-material/DynamicFeedRounded';
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';

const features = [
  { icon: DynamicFeedRoundedIcon, title: 'Live feed', text: 'See new posts the moment they are shared.' },
  { icon: GroupAddRoundedIcon, title: 'Find friends', text: 'Connect with people you know.' },
  { icon: ForumRoundedIcon, title: 'Realtime chat', text: 'Message friends with typing and seen status.' },
];

function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`flex items-center gap-2 text-lg font-semibold ${light ? 'text-white' : 'text-accent'}`}>
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          light ? 'bg-white/15 ring-1 ring-white/25' : 'bg-primary text-white'
        }`}
      >
        <ForumRoundedIcon fontSize="small" />
      </span>
      Social Media
    </Link>
  );
}

/** Two-column card used by the landing, login and register pages. */
export default function AuthShell({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-bg p-4 sm:p-8">
      <ThemeToggleButton className="absolute top-4 right-4" />
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-surface shadow-2xl shadow-black/10 ring-1 ring-line md:min-h-[600px] md:grid-cols-2">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-brand-deep p-10 text-white md:flex md:flex-col md:justify-between">
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <Logo light />
          </div>

          <div className="relative">
            <h2 className="text-3xl font-bold leading-tight">
              Share moments.
              <br />
              Stay close.
            </h2>
            <ul className="mt-8 space-y-5">
              {features.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20">
                    <Icon fontSize="small" />
                  </span>
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-white/75">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-xs text-white/60">© {new Date().getFullYear()} Social Media</p>
        </section>

        <section className="flex flex-col justify-center px-6 py-12 sm:px-12">
          <div className="mb-8 md:hidden">
            <Logo />
          </div>
          {children}
          {footer && <p className="mt-8 text-center text-sm text-muted">{footer}</p>}
        </section>
      </div>
    </main>
  );
}

/** Shared styles for auth form controls */
export const authInput =
  'h-11 w-full rounded-xl border border-line bg-surface-2 px-4 text-[15px] text-fg outline-none transition placeholder:text-subtle focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/15';
export const authLabel = 'mb-1.5 block text-sm font-medium text-fg';
export const authPrimaryBtn =
  'flex h-11 w-full items-center justify-center rounded-xl bg-primary font-medium text-white shadow-md shadow-primary/30 transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60';
export const authSecondaryBtn =
  'flex h-11 w-full items-center justify-center rounded-xl border border-line font-medium text-fg transition hover:border-primary hover:bg-primary-soft hover:text-accent';

export function OrDivider() {
  return (
    <div className="my-1 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-subtle">
      <span className="h-px flex-1 bg-line" />
      or
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
