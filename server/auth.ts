import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { prisma } from './index.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('Supabase Auth Middleware Init:', { 
    hasUrl: !!supabaseUrl, 
    hasKey: !!supabaseAnonKey,
    urlPrefix: supabaseUrl.substring(0, 30) + '...'
});

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AuthRequest extends Request {
    user?: { id: string; role: string };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    if (!supabaseUrl || !supabaseAnonKey) {
        return res.status(500).json({ error: 'Server misconfiguration: missing Supabase environment variables' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            console.error('Supabase Auth Error:', error?.message);
            return res.status(401).json({ error: 'Unauthorized: Invalid token', details: error?.message });
        }
        
        req.user = { 
            id: user.id, 
            role: user.user_metadata?.role || 'USER' 
        };
        next();
    } catch (err: any) {
        console.error('Unexpected Auth Error:', err.message);
        return res.status(500).json({ error: 'Internal server error during authentication' });
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
