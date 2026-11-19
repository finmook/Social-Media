function startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

const DAY = 24 * 60 * 60 * 1000;

export function isSameDay(a: string, b: string) {
    return startOfDay(new Date(a)) === startOfDay(new Date(b));
}

/** "3:42 PM" */
export function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Short timestamp for the conversation list: time today, weekday this week, otherwise date. */
export function formatListTime(iso: string) {
    const d = new Date(iso);
    const diffDays = (startOfDay(new Date()) - startOfDay(d)) / DAY;
    if (diffDays === 0) return formatTime(iso);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/** Separator label between days in a conversation. */
export function formatDayLabel(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = (startOfDay(now) - startOfDay(d)) / DAY;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
    });
}

export function displayName(user: { displayName: string | null } | null | undefined) {
    return user?.displayName?.trim() || 'Unnamed';
}
