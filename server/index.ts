import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

export const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3005;

// 1. Security & Parsing Middlewares
app.set('trust proxy', 1); // Respect Vercel's 'X-Forwarded-For' IP hiding
app.use(helmet()); // Basic security headers
app.use(cors({ origin: '*' })); // Should be restricted in production
app.use(express.json()); // JSON body parser

// 2. Global Rate Limiter (against basic DoS/bruteforce)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: 'draft-8',
    legacyHeaders: false,
});
app.use(limiter);

// 3. Health Check Route
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Import handlers
import { AuthHandlers, authMiddleware, adminMiddleware } from './auth.js';
import { SohHandlers } from './soh.js';
import { AnalyticsHandlers } from './analytics.js';
import { ModerationHandlers } from './moderation.js';

// Routes: Auth
app.post('/api/auth/register', AuthHandlers.register);
app.post('/api/auth/login', AuthHandlers.login);
app.get('/api/auth/me', authMiddleware, AuthHandlers.getMe);

// Routes: SOH & Data
app.get('/api/soh/explore', SohHandlers.getExplore);
app.get('/api/soh/my-entries', authMiddleware, SohHandlers.getMyEntries);
app.get('/api/soh/:id', SohHandlers.getEntryById);
app.post('/api/soh/entry', SohHandlers.addEntry);
// Routes: Analytics
app.get('/api/soh/analytics', AnalyticsHandlers.getBenchmarks);

// Routes: Moderation (Admin only)
app.get('/api/moderation/pending', authMiddleware, adminMiddleware, ModerationHandlers.getPendingFlags);
app.patch('/api/moderation/:id/status', authMiddleware, adminMiddleware, ModerationHandlers.updateStatus);

// 4. Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Backend server listening on port ${PORT}`);
    });
}

export default app;
