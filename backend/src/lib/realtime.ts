import crypto from 'crypto';
import 'dotenv/config';

/**
 * Realtime for chat uses Supabase *Broadcast* (included in the free tier).
 * - No table replication / publication setup needed.
 * - Channel names are an HMAC of the user ids, so other users cannot guess
 *   a conversation's channel and eavesdrop. The backend hands each client
 *   only the channel names it is allowed to listen on.
 */
const BASE = (process.env.SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? '';
const SIGNING_KEY = process.env.SUPABASE_JWT_SECRET ?? 'dev-only-secret';

function sign(value: string) {
  return crypto.createHmac('sha256', SIGNING_KEY).update(value).digest('hex').slice(0, 32);
}

/** Channel shared by the two people in a 1:1 conversation. */
export function dmTopic(userAId: string, userBId: string) {
  const [a, b] = [userAId, userBId].sort();
  return `dm-${sign(`dm:${a}:${b}`)}`;
}

/** Personal channel used to update a user's conversation list / unread counts. */
export function inboxTopic(userId: string) {
  return `inbox-${sign(`inbox:${userId}`)}`;
}

type BroadcastMessage = { topic: string; event: string; payload: unknown };

/** Fire-and-forget broadcast through Supabase Realtime's REST endpoint. */
export async function broadcast(messages: BroadcastMessage[]) {
  if (!BASE || !ANON_KEY) {
    console.warn('[realtime] SUPABASE_URL or SUPABASE_ANON_KEY missing; skipping broadcast');
    return;
  }
  try {
    const res = await fetch(`${BASE}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) console.error('[realtime] broadcast failed', res.status, await res.text());
  } catch (err) {
    console.error('[realtime] broadcast error', err);
  }
}
