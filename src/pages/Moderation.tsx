import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, ShieldAlert, LayoutGrid } from 'lucide-react';
import { StatusBadge, SohBadge } from '../components/ui/Badge';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Moderation() {
    const { isAdmin, currentUser } = useAuth();

    const [flags, setFlags] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAdmin) {
            fetchPending();
        }
    }, [isAdmin]);

    async function fetchPending() {
        try {
            const data = await apiFetch('/moderation/pending');
            setFlags(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function action(id: string, actionName: string) {
        if (!confirm(`Are you sure you want to perform ${actionName} on this entry?`)) return;
        try {
            // Status updates based on flags (For moderation backend it acts on to SohEntry ID).
            // Our endpoint expects ?status=APPROVED/REJECTED
            let mappedStatus = '';
            if (actionName === 'approve' || actionName === 'dismiss') mappedStatus = 'APPROVED';
            if (actionName === 'reject' || actionName === 'remove') mappedStatus = 'REJECTED';

            await apiFetch(`/moderation/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: mappedStatus })
            });
            // Refresh
            fetchPending();
        } catch (err) {
            alert('Errore durante operazione');
        }
    }

    if (!currentUser || !isAdmin) {
        return (
            <div className="p-8 flex flex-col items-center justify-center text-center min-h-[60vh]">
                <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
                <h1 className="text-2xl font-headline font-bold mb-2">Accesso Negato</h1>
                <p className="text-secondary text-sm mb-5">Area riservata ai moderatori.</p>
                <Link to="/" className="text-primary font-semibold hover:underline">Torna alla home</Link>
            </div>
        );
    }

    if (loading) return <div className="p-8">Caricamento moderazione...</div>;

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-5xl">
            <div>
                <h1 className="text-3xl font-headline font-bold mb-1 flex items-center gap-3">
                    <ShieldAlert className="w-8 h-8 text-primary" /> Moderazione
                </h1>
                <p className="text-secondary text-sm">Validazione dei dati anomali. ({flags.length} in sospeso)</p>
            </div>

            <div className="space-y-4">
                {flags.length === 0 ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-center text-emerald-800">
                        <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <h3 className="font-bold text-lg">Tutto pulito</h3>
                        <p className="text-sm">Nessuna misurazione aspetta il parere di un moderatore in questo momento.</p>
                    </div>
                ) : (
                    flags.map((flag) => (
                        <div key={flag.id} className="glass-panel ghost-border rounded-xl p-5 border-l-4 border-l-amber-400 relative">
                            <div className="flex flex-col md:flex-row gap-5 md:items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <StatusBadge status="PENDING" />
                                        <span className="text-xs text-secondary bg-surface-container px-2 py-1 rounded">Rilevata da AI</span>
                                    </div>
                                    <h3 className="font-headline font-bold text-lg mb-2">
                                        {flag.sohEntry.vehicle.oem} {flag.sohEntry.vehicle.model}
                                    </h3>
                                    <div className="grid grid-cols-2 text-sm gap-2 mt-4 bg-surface/50 p-3 rounded-lg">
                                        <div>SOH inserito: <span className="font-bold text-red-600">{flag.sohEntry.soh}%</span></div>
                                        <div>Previsto (Reg): <span className="font-bold">~{Number(JSON.parse(flag.context || '{}').predicted ?? 0).toFixed(1)}%</span></div>
                                        <div>Z-Score: <span className="font-bold">{Number(JSON.parse(flag.context || '{}').zScore ?? 0).toFixed(2)} sigma</span></div>
                                        <div className="col-span-2 text-xs text-secondary mt-1">KM: {flag.sohEntry.mileage} - {flag.sohEntry.usageType} - {flag.sohEntry.chargeType}</div>
                                    </div>
                                    <p className="text-sm mt-3 text-secondary">Motivazione flag: <span className="text-on-surface italic">"{flag.reason}"</span></p>
                                </div>

                                <div className="flex md:flex-col gap-2 shrink-0 md:min-w-48">
                                    <button onClick={() => action(flag.sohEntryId, 'approve')} className="flex-1 flex items-center justify-center gap-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                                        <CheckCircle className="w-4 h-4" /> Approva Dato
                                    </button>
                                    <button onClick={() => action(flag.sohEntryId, 'reject')} className="flex-1 flex items-center justify-center gap-2 bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                                        <XCircle className="w-4 h-4" /> Rifiuta Dato
                                    </button>
                                    <Link to={`/vehicle/${flag.sohEntryId}`} className="flex-1 flex items-center justify-center gap-2 bg-surface-container hover:bg-surface-container-high px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                        <LayoutGrid className="w-4 h-4" /> Vai al dettaglio
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
