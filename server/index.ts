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
app.set('trust proxy', 1);
app.use(helmet());

// CORS: restrict to allowed origins in production
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
    : ['http://localhost:3000'];

app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? allowedOrigins
        : '*',
    credentials: true,
}));

app.use(express.json());

// 2. Global Rate Limiter (against basic DoS/bruteforce)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
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
import { PredictiveHandlers } from './predictive.js';
import multer from 'multer';
import os from 'os';

const upload = multer({ dest: os.tmpdir() });

// Routes: Auth
app.post('/api/auth/register', AuthHandlers.register);
app.post('/api/auth/login', AuthHandlers.login);
app.get('/api/auth/me', authMiddleware, AuthHandlers.getMe);

// Routes: SOH & Data
app.get('/api/soh/explore', SohHandlers.getExplore);
app.get('/api/soh/my-entries', authMiddleware, SohHandlers.getMyEntries);
app.get('/api/soh/:id', SohHandlers.getEntryById);
app.post('/api/soh/entry', authMiddleware, SohHandlers.addEntry);

// Routes: Vehicle Catalog (for autocomplete)
app.get('/api/vehicles/oems', SohHandlers.getDistinctOems);
app.get('/api/vehicles/models', SohHandlers.getModelsByOem);

// Routes: Trips & Notes
app.get('/api/soh/:id/trips', SohHandlers.getTripsByVehicle);
app.post('/api/soh/:id/trips', authMiddleware, SohHandlers.addTrip);
app.get('/api/soh/:id/notes', SohHandlers.getNotesByVehicle);
app.post('/api/soh/:id/notes', authMiddleware, SohHandlers.addNote);
app.put('/api/soh/vehicle/:id/metadata', authMiddleware, SohHandlers.updateVehicleMetadata);
app.put('/api/soh/entry/:id/metadata', authMiddleware, SohHandlers.updateEntryMetadata);

// Routes: Analytics
app.get('/api/soh/analytics', AnalyticsHandlers.getBenchmarks);

// Routes: Predictive Model
app.post('/api/predict-soh', authMiddleware, upload.single('file'), PredictiveHandlers.predictSoh);

// Routes: Moderation
app.post('/api/moderation/report', authMiddleware, ModerationHandlers.createReport);
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
