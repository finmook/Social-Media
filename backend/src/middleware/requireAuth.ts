import type { Request, Response, NextFunction } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import 'dotenv/config';
const BASE = (process.env.SUPABASE_URL ?? '').trim().replace(/\/+$/, ''); // no trailing slash, no spaces
const ISSUER = `${BASE}/auth/v1`;
const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Missing bearer token' });

    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());


    console.log({
        ISSUER,
        payloadIss: decoded.iss,
        equal: ISSUER === decoded.iss,
        lenIssuer: ISSUER.length,
        lenPayload: decoded.iss.length,
    });

    try {

        const { payload } = await jwtVerify(token, secret, {
            issuer: ISSUER,
            audience: 'authenticated',
        });

        (req as any).authUser = {
            id: payload.sub as string,
            email: (payload as any).email as string | undefined,
        };

        next();
    } catch (err) {
        console.log('JWKS_URL =', `${process.env.SUPABASE_URL}/auth/v1/keys`);
        console.log(err)
        res.status(401).json({ error: 'Unauthorized' });
    }
}

