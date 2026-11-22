import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

/**
 * Shared, reference-counted Supabase broadcast channels.
 *
 * Why: `supabase.channel(name)` returns the *existing* channel if one with the
 * same name is still registered, and `removeChannel` finishes asynchronously.
 * When an effect unsubscribes and immediately resubscribes (React StrictMode in
 * dev, fast navigation), the new subscriber gets the channel that is shutting
 * down and never receives anything. Broadcast channel names must match the
 * server topic, so we can't just make them unique. Instead we keep one channel
 * per topic and only close it a moment after the last subscriber leaves.
 */

type BroadcastListener = (event: string, payload: unknown) => void;

type Entry = {
    channel: RealtimeChannel;
    broadcast: Set<BroadcastListener>;
    presence: Set<(channel: RealtimeChannel) => void>;
    refs: number;
    closeTimer?: ReturnType<typeof setTimeout>;
};

const entries = new Map<string, Entry>();
const CLOSE_DELAY_MS = 1500;

export type JoinOptions = {
    /** Track this user in presence (enables `channel.presenceState()`). */
    presenceKey?: string;
    onBroadcast?: BroadcastListener;
    onPresenceSync?: (channel: RealtimeChannel) => void;
};

export function joinChannel(topic: string, opts: JoinOptions = {}) {
    let entry = entries.get(topic);

    if (entry) {
        if (entry.closeTimer) clearTimeout(entry.closeTimer);
        entry.closeTimer = undefined;
    } else {
        const channel = supabase.channel(topic, {
            config: { broadcast: { self: false }, presence: { key: opts.presenceKey ?? '' } },
        });
        const created: Entry = { channel, broadcast: new Set(), presence: new Set(), refs: 0 };
        entry = created;

        channel
            .on('broadcast', { event: '*' }, (msg) => {
                created.broadcast.forEach((l) => l(msg.event, msg.payload));
            })
            .on('presence', { event: 'sync' }, () => {
                created.presence.forEach((l) => l(channel));
            })
            .subscribe(async (status, err) => {
                if (err) console.error('[realtime]', topic, err);
                if (status === 'SUBSCRIBED' && opts.presenceKey) {
                    await channel.track({ onlineAt: new Date().toISOString() });
                }
            });

        entries.set(topic, created);
    }

    const e = entry;
    e.refs += 1;
    if (opts.onBroadcast) e.broadcast.add(opts.onBroadcast);
    if (opts.onPresenceSync) {
        e.presence.add(opts.onPresenceSync);
        opts.onPresenceSync(e.channel); // deliver current state to late joiners
    }

    let left = false;
    return {
        channel: e.channel,
        leave() {
            if (left) return;
            left = true;
            if (opts.onBroadcast) e.broadcast.delete(opts.onBroadcast);
            if (opts.onPresenceSync) e.presence.delete(opts.onPresenceSync);
            e.refs -= 1;
            if (e.refs <= 0) {
                e.closeTimer = setTimeout(() => {
                    if (entries.get(topic) !== e || e.refs > 0) return;
                    entries.delete(topic);
                    supabase.removeChannel(e.channel);
                }, CLOSE_DELAY_MS);
            }
        },
    };
}
