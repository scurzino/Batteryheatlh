import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from './index.js';

// ── Zod Validation Schemas ──────────────────────────────────────────────

const addEntrySchema = z.object({
    oem: z.string().min(1),
    model: z.string().min(1),
    year: z.number().int().min(1990).max(2100),
    batteryModel: z.string().min(1),
    vehicleId: z.string().uuid().optional(),
    grossCapacity: z.union([z.number(), z.string()]).optional(),
    netCapacity: z.union([z.number(), z.string()]).optional(),
    region: z.string().min(1),
    usageType: z.string().min(1),
    chargeType: z.string().min(1),
    location: z.string().optional(),
    soh: z.union([z.number(), z.string()]).refine(v => {
        const n = typeof v === 'string' ? parseFloat(v) : v;
        return n >= 0 && n <= 120;
    }, { message: 'SOH must be between 0 and 120' }),
    mileage: z.union([z.number(), z.string()]).refine(v => {
        const n = typeof v === 'string' ? parseFloat(v) : v;
        return n >= 0 && n <= 2_000_000;
    }, { message: 'Mileage must be between 0 and 2,000,000' }),
    measurementMethod: z.string().min(1),
    measurementTemp: z.union([z.number(), z.string()]).optional(),
    date: z.string().min(1),
    notes: z.string().optional(),
});

const addTripSchema = z.object({
    km: z.union([z.number(), z.string()]),
    initialSoc: z.union([z.number(), z.string()]),
    finalSoc: z.union([z.number(), z.string()]),
    initialEnvTemp: z.union([z.number(), z.string()]),
    finalEnvTemp: z.union([z.number(), z.string()]),
    chargeType: z.string().optional(),
    date: z.string().optional(),
});

// ── Similarity Detection ────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
    const la = a.length, lb = b.length;
    const dp: number[][] = Array.from({ length: la + 1 }, (_, i) =>
        Array.from({ length: lb + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= la; i++) {
        for (let j = 1; j <= lb; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[la][lb];
}

function similarity(a: string, b: string): number {
    const al = a.toLowerCase().trim();
    const bl = b.toLowerCase().trim();
    if (al === bl) return 1;
    const maxLen = Math.max(al.length, bl.length);
    if (maxLen === 0) return 1;
    return 1 - levenshtein(al, bl) / maxLen;
}

async function findSimilarVehicleLabels(
    oem: string, model: string
): Promise<{ similarOem: string | null; similarModel: string | null }> {
    const vehicles = await prisma.vehicle.findMany({
        select: { oem: true, model: true },
        distinct: ['oem', 'model']
    });

    const THRESHOLD = 0.75;
    let similarOem: string | null = null;
    let similarModel: string | null = null;

    // Check OEM similarity
    const distinctOems = [...new Set(vehicles.map(v => v.oem))];
    for (const existingOem of distinctOems) {
        if (existingOem.toLowerCase() === oem.toLowerCase()) { similarOem = null; break; }
        const sim = similarity(oem, existingOem);
        if (sim >= THRESHOLD && sim < 1) {
            similarOem = existingOem;
        }
    }

    // Check Model similarity within same OEM
    const sameOemModels = vehicles
        .filter(v => v.oem.toLowerCase() === oem.toLowerCase())
        .map(v => v.model);
    const distinctModels = [...new Set(sameOemModels)];
    for (const existingModel of distinctModels) {
        if (existingModel.toLowerCase() === model.toLowerCase()) { similarModel = null; break; }
        const sim = similarity(model, existingModel);
        if (sim >= THRESHOLD && sim < 1) {
            similarModel = existingModel;
        }
    }

    return { similarOem, similarModel };
}

// ── Regression Analysis ─────────────────────────────────────────────────

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

// ── Route Handlers ──────────────────────────────────────────────────────

export const SohHandlers = {
    async addEntry(req: Request, res: Response) {
        try {
            // Validate input
            const parsed = addEntrySchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    error: 'Invalid input',
                    details: parsed.error.flatten().fieldErrors
                });
            }

            const { oem, model, year, batteryModel, vehicleId, ...rest } = parsed.data;

            // 1. Get or create Vehicle
            let vehicle;
            if (vehicleId) {
                vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
            }

            if (!vehicle) {
                vehicle = await prisma.vehicle.findFirst({
                    where: { oem, model, year, batteryModel }
                });
            }
            if (!vehicle) {
                vehicle = await prisma.vehicle.create({
                    data: {
                        oem, model, year, batteryModel,
                        grossCapacity: rest.grossCapacity ? parseFloat(String(rest.grossCapacity)) : undefined,
                        netCapacity: rest.netCapacity ? parseFloat(String(rest.netCapacity)) : undefined,
                        location: rest.location
                    }
                });
            } else if (!vehicle.grossCapacity && rest.grossCapacity) {
                vehicle = await prisma.vehicle.update({
                    where: { id: vehicle.id },
                    data: {
                        grossCapacity: rest.grossCapacity ? parseFloat(String(rest.grossCapacity)) : undefined,
                        netCapacity: rest.netCapacity ? parseFloat(String(rest.netCapacity)) : undefined,
                        location: rest.location
                    }
                });
            }

            // 2. Regression Check Backend-side
            const sohNumber = parseFloat(String(rest.soh));
            const mileageNumber = parseFloat(String(rest.mileage));
            const stats = await checkRegression({ oem, model, year, soh: sohNumber, mileage: mileageNumber });

            // 3. Mark logic
            const status = stats.isOutlier ? 'FLAGGED_BY_SYSTEM' : 'APPROVED';

            const entry = await prisma.sohEntry.create({
                data: {
                    vehicleId: vehicle.id,
                    userId: (req as any).user?.id || null,
                    soh: sohNumber,
                    mileage: mileageNumber,
                    region: rest.region,
                    usageType: rest.usageType,
                    chargeType: rest.chargeType,
                    measurementMethod: rest.measurementMethod,
                    measurementTemp: rest.measurementTemp ? parseFloat(String(rest.measurementTemp)) : null,
                    date: new Date(rest.date),
                    notes: rest.notes,
                    status,
                }
            });

            // 4. Similarity check on OEM/Model
            const { similarOem, similarModel } = await findSimilarVehicleLabels(oem, model);
            if (similarOem || similarModel) {
                const parts: string[] = [];
                if (similarOem) parts.push(`OEM "${oem}" is similar to existing "${similarOem}"`);
                if (similarModel) parts.push(`Model "${model}" is similar to existing "${similarModel}"`);
                await prisma.moderationFlag.create({
                    data: {
                        entryId: entry.id,
                        reportedById: null,
                        reason: `[AUTO] Possible duplicate label: ${parts.join('; ')}`,
                    }
                });
                // Also flag the entry if it wasn't already flagged by regression
                if (status === 'APPROVED') {
                    await prisma.sohEntry.update({
                        where: { id: entry.id },
                        data: { status: 'FLAGGED_BY_SYSTEM' }
                    });
                }
            }

            res.status(201).json({ message: 'Entry saved', entry, analysis: stats });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to save SOH entry' });
        }
    },

    async getExplore(req: Request, res: Response) {
        try {
            const entries = await prisma.sohEntry.findMany({
                orderBy: { date: 'desc' },
                include: { vehicle: true }
            });

            const uniqueVehicles: any[] = [];
            const seen = new Set();

            for (const e of entries) {
                if (!seen.has(e.vehicleId)) {
                    uniqueVehicles.push(e);
                    seen.add(e.vehicleId);
                }
            }

            res.json(uniqueVehicles);
        } catch (err) {
            console.error(err);
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

            // Validate input
            const parsed = addTripSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    error: 'Invalid input',
                    details: parsed.error.flatten().fieldErrors
                });
            }

            const data = parsed.data;
            const trip = await prisma.tripLog.create({
                data: {
                    userId,
                    vehicleId: req.params.id,
                    km: parseFloat(String(data.km)),
                    initialSoc: parseFloat(String(data.initialSoc)),
                    finalSoc: parseFloat(String(data.finalSoc)),
                    initialEnvTemp: parseFloat(String(data.initialEnvTemp)),
                    finalEnvTemp: parseFloat(String(data.finalEnvTemp)),
                    chargeType: data.chargeType,
                    date: data.date ? new Date(data.date) : new Date()
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
    },

    async updateVehicleMetadata(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const vehicleId = req.params.id;

            const userEntry = await prisma.sohEntry.findFirst({
                where: { vehicleId, userId }
            });

            if (!userEntry) {
                return res.status(403).json({ error: 'You do not own this vehicle record' });
            }

            const updated = await prisma.vehicle.update({
                where: { id: vehicleId },
                data: {
                    grossCapacity: req.body.grossCapacity ? parseFloat(req.body.grossCapacity) : undefined,
                    netCapacity: req.body.netCapacity ? parseFloat(req.body.netCapacity) : undefined,
                    location: req.body.location
                }
            });

            res.json(updated);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to update vehicle metadata' });
        }
    },

    async getDistinctOems(req: Request, res: Response) {
        try {
            const vehicles = await prisma.vehicle.findMany({
                select: { oem: true },
                distinct: ['oem'],
                orderBy: { oem: 'asc' }
            });
            // Merge with the static OEMS list so we always have those + any user-created ones
            const dbOems = vehicles.map(v => v.oem);
            const staticOems = ['Tesla', 'Volkswagen', 'Hyundai', 'Kia', 'Audi', 'BMW', 'Polestar', 'Renault', 'Peugeot', 'Fiat', 'MG', 'BYD'];
            const all = [...new Set([...staticOems, ...dbOems])].sort();
            res.json(all);
        } catch (err) {
            res.status(500).json({ error: 'Failed to get OEMs' });
        }
    },

    async getModelsByOem(req: Request, res: Response) {
        try {
            const oem = req.query.oem as string;
            if (!oem) return res.json([]);
            const vehicles = await prisma.vehicle.findMany({
                where: { oem: { equals: oem, mode: 'insensitive' } },
                select: { model: true },
                distinct: ['model'],
                orderBy: { model: 'asc' }
            });
            res.json(vehicles.map(v => v.model));
        } catch (err) {
            res.status(500).json({ error: 'Failed to get models' });
        }
    },

    async updateEntryMetadata(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) return res.status(401).json({ error: 'Unauthorized' });

            const entryId = req.params.id;

            const entry = await prisma.sohEntry.findUnique({ where: { id: entryId } });
            if (!entry || entry.userId !== userId) {
                return res.status(403).json({ error: 'Unauthorized update' });
            }

            const updated = await prisma.sohEntry.update({
                where: { id: entryId },
                data: {
                    measurementTemp: req.body.measurementTemp ? parseFloat(req.body.measurementTemp) : undefined
                }
            });

            res.json(updated);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to update entry metadata' });
        }
    }
};
