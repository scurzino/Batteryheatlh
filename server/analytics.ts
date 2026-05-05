import { Request, Response } from 'express';
import { prisma } from './index.js';

export const AnalyticsHandlers = {
    async getBenchmarks(req: Request, res: Response) {
        try {
            // Aggregate data for Recharts, fetching all APPROVED entries
            const entries = await prisma.sohEntry.findMany({
                where: { status: 'APPROVED' },
                include: { vehicle: true }
            });

            // Structure it for the frontend
            // The frontend currently expects an array of FlatEntry, which we will mimic
            const flatEntries = entries.map(e => ({
                id: e.id,
                oem: e.vehicle.oem,
                model: e.vehicle.model,
                year: e.vehicle.year,
                batteryModel: e.vehicle.batteryModel,
                region: e.region,
                usageType: e.usageType,
                chargeType: e.chargeType,
                location: e.vehicle.location || null,
                soh: e.soh,
                mileage: e.mileage,
                measurementMethod: e.measurementMethod,
                date: e.date.toISOString(),
                notes: e.notes || undefined,
                status: e.status
            }));

            res.json(flatEntries);
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch analytics data' });
        }
    }
};
