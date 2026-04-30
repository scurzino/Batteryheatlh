import { Request, Response } from 'express';
import { prisma } from './index.js';
import FormData from 'form-data';
import fs from 'fs';

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
            uploadedFile = file.path;

            const hasVehicle = await prisma.sohEntry.findFirst({
                where: { vehicleId: vehicleId, userId: userId }
            });

            if (!hasVehicle) {
                // If they don't have entries, maybe they have trips?
                // Just to be safe we'll keep the same check as before
                return res.status(403).json({ error: 'Il veicolo selezionato non appartiene al tuo account' });
            }

            // Create form-data instance
            const formData = new FormData();
            formData.append('file', fs.createReadStream(uploadedFile));

            // Prepare headers
            const headers: any = {
                ...formData.getHeaders(),
            };
            if (HF_ACCESS_TOKEN) {
                headers['Authorization'] = `Bearer ${HF_ACCESS_TOKEN}`;
            }

            // Forward to Hugging Face API
            // Note: We use global fetch if available, else we fall back to a library if needed.
            // Node 18+ has native fetch. Let's assume native fetch is used, but we import form-data.
            const apiRes = await fetch(HF_API_URL, {
                method: 'POST',
                headers,
                body: formData as any
            });

            if (!apiRes.ok) {
                let errorMsg = 'Errore durante la chiamata al modello remoto';
                try {
                    const errData = await apiRes.json();
                    errorMsg = errData.error || errorMsg;
                } catch (e) {}
                console.error("HF API Error:", apiRes.status, errorMsg);
                return res.status(apiRes.status).json({ error: errorMsg });
            }

            const result = await apiRes.json();
            return res.json(result);

        } catch (err) {
            console.error("Errore durante l'esecuzione del modello predittivo:", err);
            return res.status(500).json({ error: 'Errore interno del server durante l\'elaborazione del modello' });
        } finally {
            if (uploadedFile && fs.existsSync(uploadedFile)) {
                try {
                    fs.unlinkSync(uploadedFile);
                } catch (e) {
                    console.error("Failed to delete temp file:", e);
                }
            }
        }
    }
};
