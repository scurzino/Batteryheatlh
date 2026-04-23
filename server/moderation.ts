import { Request, Response } from 'express';
import { prisma } from './index.js';

export const ModerationHandlers = {
    async createReport(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            const { entryId, reason } = req.body;
            
            if (!entryId || !reason) return res.status(400).json({ error: 'Missing fields' });

            const flag = await prisma.moderationFlag.create({
                data: {
                    entryId,
                    reportedById: userId || null,
                    reason
                }
            });

            await prisma.sohEntry.update({
                where: { id: entryId },
                data: { status: 'FLAGGED_BY_SYSTEM' }
            });

            res.status(201).json({ message: 'Report created', flag });
        } catch (err) {
            res.status(500).json({ error: 'Failed to create report' });
        }
    },

    async getPendingFlags(req: Request, res: Response) {
        try {
            const pending = await prisma.sohEntry.findMany({
                where: { status: 'FLAGGED_BY_SYSTEM' },
                include: { vehicle: true, user: true, flags: { include: { reportedBy: true }, orderBy: { createdAt: 'desc' } } }
            });
            res.json(pending);
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch pending flags' });
        }
    },

    async updateStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { status } = req.body; // 'APPROVED' or 'REJECTED'

            if (!['APPROVED', 'REJECTED', 'DISMISSED'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }

            const entry = await prisma.sohEntry.update({
                where: { id },
                data: { status }
            });

            res.json({ message: 'Status updated', entry });
        } catch (err) {
            res.status(500).json({ error: 'Failed to update status' });
        }
    }
};
