import { Avatar } from '@mui/material';
import type { ChatUser } from './types';
import { displayName } from './format';

type Props = {
    user: ChatUser | null | undefined;
    size?: number;
    online?: boolean;
};

export default function UserAvatar({ user, size = 40, online = false }: Props) {
    const name = displayName(user);
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <Avatar
                src={user?.avatarUrl ?? undefined}
                alt={name}
                sx={{ width: size, height: size, bgcolor: '#3b82f6', fontSize: size * 0.4, fontWeight: 600 }}
            >
                {name.charAt(0).toUpperCase()}
            </Avatar>
            {online && (
                <span
                    aria-label="Online"
                    className="absolute bottom-0 right-0 block rounded-full bg-emerald-500 ring-2 ring-white"
                    style={{ width: Math.max(10, size * 0.28), height: Math.max(10, size * 0.28) }}
                />
            )}
        </div>
    );
}
