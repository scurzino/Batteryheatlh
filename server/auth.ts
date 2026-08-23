import { Request, Response, NextFunction } from 'express';
import { importJWK, jwtVerify } from 'jose';
import { prisma } from './index.js';

// ── Supabase ES256 Public Key (from JWKS endpoint) ─────────────────────
// This is the public verification key for your Supabase project.
// It is NOT a secret — it's publicly available at:
// https://pqazhlzkkhhsagwsoxfw.supabase.co/auth/v1/.well-known/jwks.json
// Embedded here to eliminate network calls and avoid timeouts on Vercel.
const SUPABASE_JWK = {
    alg: "ES256" as const,
    crv: "P-256" as const,
    kty: "EC" as const,
    x: "Ot7mZrOBUGrJ-kQK95dbrP08o8tzV5tBuMFY4TpyIPY",
    y: "a3feqPpMgbHnnsV3jSP0RDXLarYfQRgP8SoIAOGxnS0"
};

// Import the key once at startup (pure CPU operation, no network)
let verificationKey: CryptoKey | null = null;
const keyReady = importJWK(SUPABASE_JWK, 'ES256').then(key => {
    verificationKey = key as CryptoKey;
    console.log('Auth Middleware: ES256 public key loaded successfully');
}).catch(err => {
    console.error('FATAL: Failed to import Supabase JWK:', err.message);
});

export interface AuthRequest extends Request {
    user?: { id: string; role: string };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    // Ensure key is loaded (first request may need to wait a few ms)
    if (!verificationKey) {
        await keyReady;
        if (!verificationKey) {
            return res.status(500).json({ error: 'Server misconfiguration: failed to load verification key' });
        }
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { payload } = await jwtVerify(token, verificationKey, {
            algorithms: ['ES256'],
        });

        req.user = {
            id: payload.sub!,
            role: (payload as any).user_metadata?.role || 'USER'
        };
        next();
    } catch (err: any) {
        console.error('JWT Verification Error:', err.code, err.message);
        return res.status(401).json({ error: 'Unauthorized: Invalid token', details: err.message });
    }
}

export async function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
}

export const AuthHandlers = {
    async getMe(req: AuthRequest, res: Response) {
        try {
            let user = await prisma.user.findUnique({
                where: { id: req.user!.id },
                select: { id: true, email: true, name: true, role: true }
            });
            
            // Auto-create user profile in our DB if it doesn't exist yet but they have a valid Supabase token
            if (!user) {
                // We don't have the email in the JWT payload by default, but we can return basic structure
                user = { id: req.user!.id, email: '', name: '', role: req.user!.role };
            }
            
            res.json(user);
        } catch (err) {
            res.status(500).json({ error: 'Server error fetching profile' });
        }
    }
};
