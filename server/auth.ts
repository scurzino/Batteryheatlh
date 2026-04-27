import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './index.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is not set. The server cannot start without it.');
}

// Middleware to protect routes
export interface AuthRequest extends Request {
    user?: { id: string; role: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
}

// Admin only middleware
export async function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
}

// Auth Handlers
export const AuthHandlers = {
    async register(req: Request, res: Response) {
        try {
            const { email, password, name } = req.body;
            if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) return res.status(400).json({ error: 'Email already in use' });

            const passwordHash = await bcrypt.hash(password, 10);
            const user = await prisma.user.create({
                data: { email, passwordHash, name },
            });

            const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
            res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error during registration' });
        }
    },

    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) return res.status(401).json({ error: 'Invalid email or password' });

            const isValid = await bcrypt.compare(password, user.passwordHash);
            if (!isValid) return res.status(401).json({ error: 'Invalid email or password' });

            const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
            res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error during login' });
        }
    },

    async getMe(req: AuthRequest, res: Response) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user!.id },
                select: { id: true, email: true, name: true, role: true }
            });
            res.json(user);
        } catch (err) {
            res.status(500).json({ error: 'Server error fetching profile' });
        }
    }
};
