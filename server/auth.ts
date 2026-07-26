import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from './index.js';

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;

export interface AuthRequest extends Request {
    user?: { id: string; role: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    if (!SUPABASE_JWT_SECRET) {
        return res.status(500).json({ error: 'Server misconfiguration: missing SUPABASE_JWT_SECRET or JWT_SECRET' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, SUPABASE_JWT_SECRET) as { sub: string; role?: string };
        req.user = { 
            id: decoded.sub, 
            role: decoded.role || 'USER' 
        };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
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
