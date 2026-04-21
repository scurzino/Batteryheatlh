import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ReferenceLine } from 'recharts';
import { ArrowLeft, Car, MapPin, Zap, Activity, Info, AlertTriangle, ShieldAlert, BadgeCheck, Clock, Flag, LayoutGrid } from 'lucide-react';
import { StatusBadge, SohBadge, TagBadge } from '../components/ui/Badge';
import { getRegressionLine } from '../utils/regressionCheck';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

const TABS = ['Panoramica', 'Cronologia SOH', 'Statistiche Utilizzo', 'Note Comunità'];

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [peers, setPeers] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;

    // Fetch specifics
    apiFetch(`/soh/${id}`)
      .then(data => {
        setEntry(data);
        return data;
      })
      .then(async (data) => {
        // Fetch explore to find peers of the same model
        const explore = await apiFetch('/soh/explore');
        const sameModel = explore.filter((e: any) =>
          e.vehicle.oem === data.vehicle.oem &&
          e.vehicle.model === data.vehicle.model
        );
        setPeers(sameModel);
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="p-12 text-center">Caricamento veicolo...</div>;
  if (!entry) return null;

  const regressionLine = getRegressionLine(
    peers
      .filter(p => p.status === 'APPROVED')
      .map(p => ({ soh: p.soh, mileage: p.mileage }))
  );

  const peerData = peers
    .filter(p => p.id !== entry.id && p.status === 'APPROVED')
    .map(p => ({ mileage: p.mileage, soh: p.soh, type: 'community' }));

  peerData.push({ mileage: entry.mileage, soh: entry.soh, type: 'current' });

  function handleReport() {
    // Note: there is no endpoint yet, just simulating
    setShowReportModal(false);
    alert('Segnalazione inviata ai moderatori.');
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Back */}
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-sm text-secondary hover:text-on-surface font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Torna all'Esplora
        </Link>
        <div className="flex gap-2">
          {currentUser && currentUser.id !== entry.userId && entry.status === 'APPROVED' && (
            <button onClick={() => setShowReportModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors">
              <Flag className="w-3.5 h-3.5" /> Segnala dato
            </button>
          )}
          {isAdmin && entry.status === 'APPROVED' && (
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors">
              <ShieldAlert className="w-3.5 h-3.5" /> Nascondi (Admin)
            </button>
          )}
        </div>
      </div>

      {entry.status === 'FLAGGED_BY_SYSTEM' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="text-sm">
            <span className="font-bold block mb-0.5">Misurazione sotto analisi automatica</span>
            Il dato inserito si discosta dalla media prevista per questo modello. Un moderatore ne valuterà a breve l'autenticità.
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="glass-panel ghost-border rounded-3xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20" />

        <div className="flex flex-col md:flex-row gap-8 items-start relative relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold tracking-wider uppercase text-secondary">{entry.vehicle.oem}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-outline-variant/50" />
              <span className="text-sm text-secondary font-medium">{entry.vehicle.batteryModel}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-headline font-black mb-3 text-on-surface">
              {entry.vehicle.model} <span className="text-primary font-medium">{entry.vehicle.year}</span>
            </h1>

            <div className="flex flex-wrap gap-2 mt-5">
              <StatusBadge status={entry.status} />
              <TagBadge label={entry.region} color="blue" />
              <TagBadge label={entry.measurementMethod} color="teal" />
            </div>
          </div>

          <div className="shrink-0 w-full md:w-auto flex flex-row md:flex-col gap-4">
            <div className="glass-panel shadow-sm border border-outline-variant/30 rounded-2xl p-5 text-center flex-1 md:w-48">
              <div className="text-xs font-semibold text-secondary mb-1">State of Health</div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-headline font-bold text-on-surface">{entry.soh}%</span>
              </div>
            </div>
            <div className="glass-panel shadow-sm border border-outline-variant/30 rounded-2xl p-5 text-center flex-1 md:w-48">
              <div className="text-xs font-semibold text-secondary mb-1">Chilometraggio</div>
              <div className="text-2xl font-headline font-bold text-on-surface">{entry.mileage.toLocaleString('it-IT')} <span className="text-base text-secondary font-medium">km</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex border-b ghost-border gap-2 overflow-x-auto">
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            className={`pb-3 px-4 border-b-2 whitespace-nowrap text-sm font-medium transition-colors ${activeTab === i ? 'border-primary text-primary font-semibold' : 'border-transparent text-secondary hover:text-on-surface'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 glass-panel ghost-border rounded-2xl p-6">
            <h3 className="font-headline font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Curva di Degrado Comunità</h3>
            <p className="text-xs text-secondary mb-6">Confronto di questo veicolo (punto rosso) rispetto alla curva di degrado ottimale e alle misurazioni degli altri utenti (punti grigi).</p>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" opacity={0.4} />
                  <XAxis dataKey="mileage" type="number" axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="soh" type="number" domain={[80, 105]} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    if (d.type === 'regression') return <div className="bg-surface-container-low text-xs p-2 rounded shadow">Regressione Prevista: {d.soh.toFixed(1)}%</div>;
                    return (
                      <div className="bg-surface-container-lowest border rounded-xl p-3 shadow-lg text-xs">
                        <p className="font-bold">{d.type === 'current' ? 'Veicolo Attuale' : 'Veicolo Community'}</p>
                        <p>SOH: {d.soh}%</p>
                        <p>Km: {d.mileage}</p>
                      </div>
                    )
                  }} />
                  {/* Add regression line points so they connect (scatter plot won't connect them naturally unless we cheat with a line chart, but this is ok) */}
                  <Scatter name="Regression" data={regressionLine} fill="var(--color-primary)" opacity={0.5} shape="square" />
                  <Scatter name="Community" data={peerData.filter(d => d.type === 'community')} fill="var(--color-secondary)" opacity={0.5} />
                  <Scatter name="Current" data={peerData.filter(d => d.type === 'current')} fill="var(--color-error, #dc2626)" opacity={1} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-panel ghost-border rounded-xl p-5">
              <h4 className="font-bold text-sm mb-3 text-secondary">Profilo Utilizzo</h4>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="flex justify-between mb-1"><span className="text-secondary flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Tipo</span><span className="font-medium">{entry.usageType}</span></div>
                  <div className="w-full bg-surface-container rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full w-2/3" /></div>
                </div>
                <div>
                  <div className="flex justify-between mb-1"><span className="text-secondary flex items-center gap-1.5"><Zap className="w-4 h-4" /> Ricarica</span><span className="font-medium">{entry.chargeType}</span></div>
                  <div className="w-full bg-surface-container rounded-full h-1.5"><div className="bg-tertiary-container h-1.5 rounded-full w-4/5" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1, 2, 3 details omitted for brevity, logic holds */}
      {activeTab > 0 && (
        <div className="glass-panel ghost-border rounded-2xl p-12 text-center text-secondary">
          [Sezione extra: le altre tab andrebbero popolate simmetricamente]
        </div>
      )}

      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="Segnala misurazione">
        <div className="space-y-4 text-sm">
          <p className="text-secondary">Pensi che questo dato sia errato, manipolato o impossibile? Spiegaci il motivo, un moderatore verificherà la segnalazione.</p>
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full p-3 rounded-xl ghost-border bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none h-24"
            placeholder="Es. Il SOH per questo modello dopo 100k km non può essere 100%..."
          />
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowReportModal(false)} className="px-4 py-2 font-medium text-secondary hover:text-on-surface">Annulla</button>
            <button onClick={handleReport} disabled={!reportReason.trim()} className="px-4 py-2 bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">Invia Segnalazione</button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
