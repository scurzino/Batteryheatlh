import { Request, Response } from 'express';
import { prisma } from './index.js';

interface RegressionResult {
    isOutlier: boolean;
    deviation: number;
    sigma: number;
    predicted: number;
    zScore: number;
}

function fitExponential(peers: Array<{ mileage: number; soh: number }>): { A: number; k: number } | null {
    const valid = peers.filter((p) => p.soh > 0);
    if (valid.length < 2) return null;

    const n = valid.length;
    const xs = valid.map((p) => p.mileage);
    const ys = valid.map((p) => Math.log(p.soh));

    const xBar = xs.reduce((s, x) => s + x, 0) / n;
    const yBar = ys.reduce((s, y) => s + y, 0) / n;

    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
        num += (xs[i] - xBar) * (ys[i] - yBar);
        den += (xs[i] - xBar) ** 2;
    }

    if (den === 0) return null;
    const slope = num / den;
    const intercept = yBar - slope * xBar;

    return { A: Math.exp(intercept), k: -slope };
}

function predictExp(A: number, k: number, mileage: number): number {
    return Math.min(100, Math.max(0, A * Math.exp(-k * mileage)));
}

async function checkRegression(
    entry: { oem: string; model: string; year: number; soh: number; mileage: number }
): Promise<RegressionResult> {
    const vehicleProps = await prisma.vehicle.findFirst({
        where: { oem: entry.oem, model: entry.model, year: entry.year }
    });

    if (!vehicleProps) return { isOutlier: false, deviation: 0, sigma: 0, predicted: entry.soh, zScore: 0 };

    const peers = await prisma.sohEntry.findMany({
        where: { vehicleId: vehicleProps.id, status: 'APPROVED' },
        select: { mileage: true, soh: true }
    });

    if (peers.length < 3) return { isOutlier: false, deviation: 0, sigma: 0, predicted: entry.soh, zScore: 0 };

    const fit = fitExponential(peers);
    if (!fit) return { isOutlier: false, deviation: 0, sigma: 0, predicted: entry.soh, zScore: 0 };

    const { A, k } = fit;
    const predicted = predictExp(A, k, entry.mileage);
    const residuals = peers.map((p) => p.soh - predictExp(A, k, p.mileage));
    const n = residuals.length;
    const variance = residuals.reduce((s, r) => s + r ** 2, 0) / n;
    const sigma = Math.sqrt(variance);

    const deviation = entry.soh - predicted;
    const zScore = sigma === 0 ? 0 : Math.abs(deviation) / sigma;

    return { isOutlier: zScore > 2, deviation, sigma, predicted, zScore };
}

export const SohHandlers = {
    async addEntry(req: Request, res: Response) {
        try {
            const dbEntry = req.body;
            const { oem, model, year, batteryModel, ...rest } = dbEntry;

            // 1. Get or create Vehicle
            let vehicle = await prisma.vehicle.findFirst({
                where: { oem, model, year, batteryModel }
            });
            if (!vehicle) {
                vehicle = await prisma.vehicle.create({
                    data: { oem, model, year, batteryModel }
                });
            }

            // 2. Regression Check Backend-side
            const stats = await checkRegression({ oem, model, year, soh: rest.soh, mileage: rest.mileage });

            // 3. Mark logic
            const status = stats.isOutlier ? 'FLAGGED_BY_SYSTEM' : 'APPROVED';

            const entry = await prisma.sohEntry.create({
                data: {
                    vehicleId: vehicle.id,
                    userId: (req as any).user?.id || null, // Optional if auth middleware not strictly applied
                    soh: rest.soh,
                    mileage: rest.mileage,
                    region: rest.region,
                    usageType: rest.usageType,
                    chargeType: rest.chargeType,
                    measurementMethod: rest.measurementMethod,
                    minEnvTemp: rest.minEnvTemp,
                    maxEnvTemp: rest.maxEnvTemp,
                    date: new Date(rest.date),
                    notes: rest.notes,
                    status,
                }
            });

            res.status(201).json({ message: 'Entry saved', entry, analysis: stats });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to save SOH entry' });
        }
    },

    async getExplore(req: Request, res: Response) {
        try {
            // Returns populated entries for Explorer
            const entries = await prisma.sohEntry.findMany({
                include: { vehicle: true },
                orderBy: { date: 'desc' }
            });
            res.json(entries);
        } catch (err) {
            res.status(500).json({ error: 'Failed to get entries' });
        }
    },

    async getMyEntries(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });
            const entries = await prisma.sohEntry.findMany({
                where: { userId },
                include: { vehicle: true },
                orderBy: { date: 'desc' }
            });
            res.json(entries);
        } catch (err) {
            res.status(500).json({ error: 'Failed to get user entries' });
        }
    },

    async getEntryById(req: Request, res: Response) {
        try {
            const entry = await prisma.sohEntry.findUnique({
                where: { id: req.params.id },
                include: { vehicle: true }
            });
            if (!entry) return res.status(404).json({ error: 'Entry not found' });
            res.json(entry);
        } catch (err) {
            res.status(500).json({ error: 'Failed to get entry' });
        }
    },

    async getTripsByVehicle(req: Request, res: Response) {
        try {
            const trips = await prisma.tripLog.findMany({
                where: { vehicleId: req.params.id },
                include: { user: { select: { name: true } } },
                orderBy: { date: 'desc' }
            });
            res.json(trips);
        } catch (err) {
            res.status(500).json({ error: 'Failed to get trips' });
        }
    },

    async addTrip(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });
            
            const trip = await prisma.tripLog.create({
                data: {
                    userId,
                    vehicleId: req.params.id,
                    km: parseFloat(req.body.km),
                    initialSoc: parseFloat(req.body.initialSoc),
                    finalSoc: parseFloat(req.body.finalSoc),
                    initialEnvTemp: parseFloat(req.body.initialEnvTemp),
                    finalEnvTemp: parseFloat(req.body.finalEnvTemp),
                    chargeType: req.body.chargeType,
                    date: req.body.date ? new Date(req.body.date) : new Date()
                }
            });
            res.status(201).json(trip);
        } catch (err) {
            res.status(500).json({ error: 'Failed to add trip' });
        }
    },

    async getNotesByVehicle(req: Request, res: Response) {
        try {
            const notes = await prisma.vehicleNote.findMany({
                where: { vehicleId: req.params.id },
                include: { user: { select: { name: true, role: true } } },
                orderBy: { createdAt: 'desc' }
            });
            res.json(notes);
        } catch (err) {
            res.status(500).json({ error: 'Failed to get notes' });
        }
    },

    async addNote(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const note = await prisma.vehicleNote.create({
                data: {
                    userId,
                    vehicleId: req.params.id,
                    content: req.body.content
                }
            });
            res.status(201).json(note);
        } catch (err) {
            res.status(500).json({ error: 'Failed to add note' });
        }
    }
};
