import { Request, Response } from 'express';
import { prisma } from './index';

export const ModerationHandlers = {
    async getPendingFlags(req: Request, res: Response) {
        try {
            const pending = await prisma.sohEntry.findMany({
                where: { status: 'FLAGGED_BY_SYSTEM' },
                include: { vehicle: true, user: true }
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
