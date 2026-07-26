import { Request, Response } from 'express';
import { prisma } from './index.js';
import { Blob } from 'buffer';

const HF_API_URL = process.env.HF_API_URL || "https://scurzino-ev-soh-api.hf.space/predict";
const HF_ACCESS_TOKEN = process.env.HF_ACCESS_TOKEN;

export const PredictiveHandlers = {
    async predictSoh(req: Request, res: Response) {
        let uploadedFile: string | null = null;
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Non autorizzato' });
            }

            const { vehicleId } = req.body;
            if (!vehicleId) {
                return res.status(400).json({ error: 'Nessun veicolo selezionato' });
            }

            const file = req.file;
            if (!file) {
                return res.status(400).json({ error: 'Nessun file CSV caricato' });
            }
            // Non salviamo più il path, useremo il buffer in memoria

            const hasVehicle = await prisma.sohEntry.findFirst({
                where: { vehicleId: vehicleId, userId: userId }
            });

            if (!hasVehicle) {
                return res.status(403).json({ error: 'Il veicolo selezionato non appartiene al tuo account' });
            }

            // Usiamo direttamente il buffer in memoria (req.file.buffer)
            const blob = new Blob([file.buffer], { type: 'text/csv' });
            
            const formData = new FormData();
            formData.append('file', blob, req.file.originalname || 'data.csv');

            // Prepare headers
            const headers: Record<string, string> = {};
            if (HF_ACCESS_TOKEN) {
                headers['Authorization'] = `Bearer ${HF_ACCESS_TOKEN}`;
            }

            // Forward to Hugging Face API
            // Usando fetch nativo + FormData nativo, il boundary viene generato automaticamente!
            const apiRes = await fetch(HF_API_URL, {
                method: 'POST',
                headers,
                body: formData
            });

            if (!apiRes.ok) {
                console.error("HF API Error:", apiRes.status);
                // Evitiamo di ritornare l'errore nudo dal provider (potrebbe contenere stack trace sensibili)
                return res.status(502).json({ error: 'Errore di comunicazione con il modello predittivo remoto' });
            }

            const result = await apiRes.json();
            return res.json(result);

        } catch (err) {
            console.error("Errore durante l'esecuzione del modello predittivo:", err);
            return res.status(500).json({ error: 'Errore interno del server durante l\'elaborazione del modello' });
        }
    }
};
