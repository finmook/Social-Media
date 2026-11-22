import Link from 'next/link';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';

export default function ChatHome() {
    return (
        <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-surface to-primary-soft/60 p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30">
                <ForumRoundedIcon sx={{ fontSize: 40 }} />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-fg">Your messages</h2>
            <p className="mt-1 max-w-xs text-sm text-muted">
                Pick a friend from the list to start chatting, or find new people to connect with.
            </p>
            <Link
                href="/Contacts"
                className="mt-5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-primary-hover"
            >
                Find friends
            </Link>
        </div>
    );
}
