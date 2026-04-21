import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, ShieldAlert, LayoutGrid } from 'lucide-react';
import { MOCK_ENTRIES, FlatEntry } from '../data/mockData';
import { StatusBadge, SohBadge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';

// In-memory moderation state for the session
const pendingState: Record<string, 'approved' | 'rejected' | null> = {};
const flaggedState: Record<string, 'dismissed' | 'removed' | null> = {};

export default function Moderation() {
    const { currentUser, isAdmin } = useAuth();
    const [tick, setTick] = useState(0);

    if (!currentUser || !isAdmin) {
        return (
            <div className="p-8 flex flex-col items-center justify-center text-center min-h-[60vh]">
                <ShieldAlert className="w-10 h-10 text-secondary mb-4" />
                <h1 className="text-2xl font-headline font-bold mb-2">Accesso negato</h1>
                <p className="text-secondary text-sm mb-5">Questa pagina è riservata agli amministratori.</p>
                <Link to="/" className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors">
                    Torna all'Esplora
                </Link>
            </div>
        );
    }

    const pending = MOCK_ENTRIES.filter((e) => e.status === 'pending_moderation');
    const flagged = MOCK_ENTRIES.filter((e) => e.status === 'flagged');

    function approve(id: string) { pendingState[id] = 'approved'; setTick(t => t + 1); }
    function reject(id: string) { pendingState[id] = 'rejected'; setTick(t => t + 1); }
    function dismiss(id: string) { flaggedState[id] = 'dismissed'; setTick(t => t + 1); }
    function remove(id: string) { flaggedState[id] = 'removed'; setTick(t => t + 1); }

    const pendingActioned = pending.filter((e) => pendingState[e.id]);
    const flaggedActioned = flagged.filter((e) => flaggedState[e.id]);

    return (
        <div className="p-6 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-headline font-bold mb-1">Moderazione</h1>
                    <p className="text-secondary text-sm">Gestisci le misurazioni in attesa e le segnalazioni degli utenti.</p>
                </div>
                <Link to="/" className="flex items-center gap-2 text-sm text-secondary hover:text-on-surface font-medium">
                    <LayoutGrid className="w-4 h-4" /> Dashboard
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'In attesa', value: pending.length, color: 'text-amber-600' },
                    { label: 'Segnalate', value: flagged.length, color: 'text-red-600' },
                    { label: 'Approvate (sessione)', value: Object.values(pendingState).filter(v => v === 'approved').length, color: 'text-emerald-600' },
                    { label: 'Rifiutate (sessione)', value: Object.values(pendingState).filter(v => v === 'rejected').length, color: 'text-secondary' },
                ].map((stat) => (
                    <div key={stat.label} className="glass-panel ghost-border rounded-2xl p-5">
                        <div className="text-xs font-semibold text-secondary mb-1">{stat.label}</div>
                        <div className={`text-3xl font-headline font-bold ${stat.color}`}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Pending */}
            <section>
                <h2 className="text-lg font-headline font-bold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    In attesa di revisione ({pending.length})
                </h2>
                {pending.length === 0 ? (
                    <div className="glass-panel ghost-border rounded-2xl p-8 text-center text-secondary text-sm">Nessuna misurazione in attesa.</div>
                ) : (
                    <div className="space-y-3">
                        {pending.map((entry) => {
                            const action = pendingState[entry.id];
                            return (
                                <div key={entry.id} className={`glass-panel ghost-border rounded-2xl p-5 transition-all ${action ? 'opacity-60' : ''}`}>
                                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-headline font-bold">{entry.oem} {entry.model} {entry.year}</span>
                                                <SohBadge soh={entry.soh} />
                                            </div>
                                            <div className="text-xs text-secondary space-y-0.5">
                                                <p>Utente: <span className="font-medium text-on-surface">{entry.userName}</span> · Data: {new Date(entry.date).toLocaleDateString('it-IT')} · {entry.mileage.toLocaleString('it-IT')} km</p>
                                                <p>Regione: {entry.region} · Utilizzo: {entry.usageType} · Ricarica: {entry.chargeType}</p>
                                                <p>Metodo: {entry.measurementMethod}</p>
                                                {entry.notes && <p className="italic">"{entry.notes}"</p>}
                                            </div>
                                        </div>
                                        <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                                            {!action ? (
                                                <>
                                                    <button onClick={() => approve(entry.id)} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-200 transition-colors">
                                                        <CheckCircle className="w-4 h-4" /> Approva
                                                    </button>
                                                    <button onClick={() => reject(entry.id)} className="flex items-center gap-1.5 px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-200 transition-colors">
                                                        <XCircle className="w-4 h-4" /> Rifiuta
                                                    </button>
                                                </>
                                            ) : (
                                                <div className={`px-4 py-2 rounded-xl text-sm font-semibold ${action === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                    {action === 'approved' ? '✅ Approvata' : '❌ Rifiutata'}
                                                </div>
                                            )}
                                            <Link to={`/vehicle/${entry.id}`} className="px-4 py-2 ghost-border bg-surface-container rounded-xl text-xs font-medium text-center hover:bg-surface-container-high transition-colors">
                                                Dettagli
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Flagged */}
            <section>
                <h2 className="text-lg font-headline font-bold mb-4 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                    Segnalate dagli utenti ({flagged.length})
                </h2>
                {flagged.length === 0 ? (
                    <div className="glass-panel ghost-border rounded-2xl p-8 text-center text-secondary text-sm">Nessuna misurazione segnalata.</div>
                ) : (
                    <div className="space-y-3">
                        {flagged.map((entry) => {
                            const action = flaggedState[entry.id];
                            return (
                                <div key={entry.id} className={`glass-panel ghost-border rounded-2xl p-5 border-red-200/40 transition-all ${action ? 'opacity-60' : ''}`}>
                                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-headline font-bold">{entry.oem} {entry.model} {entry.year}</span>
                                                <SohBadge soh={entry.soh} />
                                                <StatusBadge status={entry.status} />
                                            </div>
                                            <div className="text-xs text-secondary space-y-0.5">
                                                <p>Utente: <span className="font-medium text-on-surface">{entry.userName}</span> · {entry.mileage.toLocaleString('it-IT')} km · {entry.region}</p>
                                                {entry.flagReason && (
                                                    <p className="mt-1 p-2 bg-red-50 rounded-lg text-red-800 border border-red-100">
                                                        <span className="font-semibold">Motivo segnalazione:</span> {entry.flagReason}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                                            {!action ? (
                                                <>
                                                    <button onClick={() => dismiss(entry.id)} className="px-4 py-2 ghost-border bg-surface-container rounded-xl text-sm font-medium hover:bg-surface-container-high transition-colors">
                                                        Ignora
                                                    </button>
                                                    <button onClick={() => remove(entry.id)} className="flex items-center gap-1.5 px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-semibold hover:bg-red-200 transition-colors">
                                                        <XCircle className="w-4 h-4" /> Rimuovi
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="px-4 py-2 rounded-xl text-sm font-semibold bg-surface-container text-secondary">
                                                    {action === 'dismissed' ? 'Ignorata' : '❌ Rimossa'}
                                                </div>
                                            )}
                                            <Link to={`/vehicle/${entry.id}`} className="px-4 py-2 ghost-border bg-surface-container rounded-xl text-xs font-medium text-center hover:bg-surface-container-high transition-colors">
                                                Dettagli
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
