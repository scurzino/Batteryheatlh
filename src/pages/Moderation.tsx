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
            // Status updates directly onto the SohEntry ID
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
            alert('Error performing operation');
        }
    }

    if (!currentUser || !isAdmin) {
        return (
            <div className="p-8 flex flex-col items-center justify-center text-center min-h-[60vh]">
                <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
                <h1 className="text-2xl font-headline font-bold mb-2">Access Denied</h1>
                <p className="text-secondary text-sm mb-5">This area is reserved for moderators.</p>
                <Link to="/" className="text-primary font-semibold hover:underline">Back to Home</Link>
            </div>
        );
    }

    if (loading) return <div className="p-8">Loading moderation queue...</div>;

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-5xl">
            <div>
                <h1 className="text-3xl font-headline font-bold mb-1 flex items-center gap-3">
                    <ShieldAlert className="w-8 h-8 text-primary" /> Moderation
                </h1>
                <p className="text-secondary text-sm">Validation of anomalous data. ({flags.length} pending)</p>
            </div>

            <div className="space-y-4">
                {flags.length === 0 ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 text-center text-emerald-800">
                        <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <h3 className="font-bold text-lg">All Clear</h3>
                        <p className="text-sm">No measurements are awaiting moderator review at this time.</p>
                    </div>
                ) : (
                    flags.map((entry) => (
                        <div key={entry.id} className="glass-panel ghost-border rounded-xl p-5 border-l-4 border-l-amber-400 relative">
                            <div className="flex flex-col md:flex-row gap-5 md:items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <StatusBadge status="PENDING" />
                                        <span className={`text-xs px-2 py-1 rounded font-semibold ${
                                            entry.flags?.some((f: any) => f.reason?.startsWith('[AUTO] Possible duplicate'))
                                                ? 'bg-purple-100 text-purple-800'
                                                : entry.flags?.length > 0
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'text-secondary bg-surface-container'
                                        }`}>
                                            {entry.flags?.some((f: any) => f.reason?.startsWith('[AUTO] Possible duplicate'))
                                                ? 'Label Similarity Check'
                                                : entry.flags?.length > 0 ? 'User Report' : 'Detected by AI Backend'}
                                        </span>
                                    </div>
                                    <h3 className="font-headline font-bold text-lg mb-2">
                                        {entry.vehicle?.oem} {entry.vehicle?.model} ({entry.vehicle?.year})
                                    </h3>
                                    {entry.flags?.length > 0 && (
                                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm text-amber-900 mb-2">
                                            <span className="font-bold">Reason:</span> "{entry.flags[0].reason}"
                                            <div className="text-xs mt-1 text-amber-700/70">Reported by: {entry.flags[0].reportedBy?.name || 'Anonymous User'}</div>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 text-sm gap-2 mt-4 bg-surface/50 p-3 rounded-lg">
                                        <div>Reported SOH: <span className="font-bold text-red-600">{entry.soh}%</span></div>
                                        <div className="col-span-2 text-xs text-secondary mt-1">Km: {entry.mileage} - {entry.usageType} - {entry.chargeType}</div>
                                    </div>
                                    {entry.notes && (
                                        <p className="text-sm mt-3 text-secondary">Driver notes: <span className="text-on-surface italic">"{entry.notes}"</span></p>
                                    )}
                                </div>

                                <div className="flex md:flex-col gap-2 shrink-0 md:min-w-48">
                                    <button onClick={() => action(entry.id, 'approve')} className="flex-1 flex items-center justify-center gap-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                                        <CheckCircle className="w-4 h-4" /> Approve Data
                                    </button>
                                    <button onClick={() => action(entry.id, 'reject')} className="flex-1 flex items-center justify-center gap-2 bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                                        <XCircle className="w-4 h-4" /> Reject Data
                                    </button>
                                    <Link to={`/vehicle/${entry.id}`} className="flex-1 flex items-center justify-center gap-2 bg-surface-container hover:bg-surface-container-high px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                        <LayoutGrid className="w-4 h-4" /> View Details
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
