import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ReferenceLine } from 'recharts';
import { Battery, Info, Zap, AlertTriangle, MapPin, Gauge, ArrowLeft, Flag, CheckCircle } from 'lucide-react';
import { MOCK_ENTRIES, MOCK_USERS } from '../data/mockData';
import { StatusBadge, SohBadge, TagBadge } from '../components/ui/Badge';
import { getRegressionLine } from '../utils/regressionCheck';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';

// Simulate historical SOH series for the detail chart
function buildHistory(currentSoh: number, mileage: number) {
  const points = 8;
  const result = [];
  for (let i = 0; i < points; i++) {
    const frac = i / (points - 1);
    const km = Math.round((mileage * frac) / 1000) * 1000;
    const soh = 100 - (100 - currentSoh) * frac;
    result.push({ km: `${(km / 1000).toFixed(0)}k`, soh: parseFloat(soh.toFixed(2)) });
  }
  return result;
}

const TABS = ['Panoramica', 'Cronologia SOH', 'Statistiche Utilizzo', 'Note Comunità'];

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reported, setReported] = useState(false);

  const entry = MOCK_ENTRIES.find((e) => e.id === id);

  if (!entry) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Battery className="w-10 h-10 text-secondary mb-3" />
        <h2 className="font-headline font-bold text-xl mb-2">Misurazione non trovata</h2>
        <p className="text-secondary text-sm mb-5">L'ID richiesto non esiste nel database.</p>
        <Link to="/" className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Torna all'Esplora
        </Link>
      </div>
    );
  }

  const history = buildHistory(entry.soh, entry.mileage);
  const regressionLine = getRegressionLine(entry.oem, entry.model, entry.year, MOCK_ENTRIES);

  // Peers for community notes
  const peers = MOCK_ENTRIES.filter((e) => e.oem === entry.oem && e.model === entry.model && e.id !== entry.id && e.status === 'approved').slice(0, 3);

  function handleReport() {
    if (!reportReason.trim()) return;
    setReported(true);
    setReportOpen(false);
    setReportReason('');
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-br from-primary/10 via-surface-container to-surface-container-high border-b ghost-border h-52 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, var(--color-primary) 0%, transparent 60%)' }} />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 md:flex justify-between items-end">
          <div>
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-secondary hover:text-on-surface mb-4 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Torna all'Esplora
            </Link>
            <div className="inline-block px-2 py-1 bg-surface-container-lowest/80 backdrop-blur rounded text-xs font-semibold font-mono text-on-surface mb-2 ghost-border ml-3">
              {entry.oem}
            </div>
            <h1 className="text-3xl font-headline font-bold text-on-surface">{entry.model} <span className="font-medium text-secondary">{entry.year}</span></h1>
            <p className="text-sm text-secondary mt-1">{entry.batteryModel}</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-4 items-end">
            <div className="text-right">
              <div className="text-secondary text-xs font-medium mb-1">SOH Rilevato</div>
              <div className={`text-4xl font-bold flex items-baseline gap-1 ${entry.soh >= 95 ? 'text-emerald-600' : entry.soh >= 88 ? 'text-amber-600' : 'text-red-600'}`}>
                {entry.soh.toFixed(1)}<span className="text-lg">%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">

        {/* Sub-navigation */}
        <div className="flex border-b ghost-border gap-1 overflow-x-auto">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`pb-3 px-3 border-b-2 whitespace-nowrap text-sm font-medium transition-colors ${activeTab === i ? 'border-primary text-primary font-semibold' : 'border-transparent text-secondary hover:text-on-surface'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── PANORAMICA TAB ───────────────────────────────────────────── */}
        {activeTab === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main */}
            <div className="lg:col-span-2 space-y-6">
              {entry.status !== 'approved' && (
                <div className={`p-4 rounded-2xl flex items-start gap-3 ${entry.status === 'pending_moderation' ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
                  <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${entry.status === 'pending_moderation' ? 'text-amber-600' : 'text-red-600'}`} />
                  <div>
                    <div className="font-semibold text-sm">{entry.status === 'pending_moderation' ? 'Misurazione in revisione' : 'Misurazione segnalata'}</div>
                    <p className="text-xs mt-1 opacity-80">{entry.status === 'pending_moderation' ? 'Il valore SOH si discosta dalla regressione del modello e attende verifica da un moderatore.' : entry.flagReason}</p>
                  </div>
                </div>
              )}

              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Gauge, label: 'Chilometraggio', value: `${entry.mileage.toLocaleString('it-IT')} km`, color: 'text-primary' },
                  { icon: MapPin, label: 'Regione', value: entry.region, color: 'text-blue-600' },
                  { icon: Zap, label: 'Ricarica', value: entry.chargeType.replace('Prevalentemente ', ''), color: 'text-amber-600' },
                  { icon: Battery, label: 'Utilizzo', value: entry.usageType, color: 'text-emerald-600' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="glass-panel ghost-border rounded-xl p-4">
                    <Icon className={`w-4 h-4 ${color} mb-2`} />
                    <div className="text-xs text-secondary mb-0.5">{label}</div>
                    <div className="text-sm font-bold">{value}</div>
                  </div>
                ))}
              </div>

              {/* Badges */}
              <div className="glass-panel ghost-border rounded-2xl p-5">
                <h3 className="font-headline font-bold mb-4 text-sm text-secondary uppercase tracking-wide">Dettaglio misurazione</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div><span className="text-secondary block text-xs">Metodo misura</span><span className="font-semibold">{entry.measurementMethod}</span></div>
                  <div><span className="text-secondary block text-xs">Data</span><span className="font-semibold">{new Date(entry.date).toLocaleDateString('it-IT')}</span></div>
                  <div><span className="text-secondary block text-xs">Inviato da</span><span className="font-semibold">{entry.userName}</span></div>
                  <div><span className="text-secondary block text-xs">Stato</span><StatusBadge status={entry.status} /></div>
                  <div><span className="text-secondary block text-xs">SOH</span><SohBadge soh={entry.soh} /></div>
                  {entry.notes && <div className="col-span-2"><span className="text-secondary block text-xs">Note</span><span className="font-medium">{entry.notes}</span></div>}
                </div>
              </div>
            </div>

            {/* Side */}
            <div className="space-y-5">
              <div className="glass-panel ghost-border rounded-2xl p-5">
                <h3 className="font-headline font-bold mb-3">Azioni</h3>
                <div className="space-y-2">
                  {currentUser && !reported && (
                    <button
                      onClick={() => setReportOpen(true)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
                    >
                      <Flag className="w-4 h-4" /> Segnala dato sospetto
                    </button>
                  )}
                  {reported && (
                    <div className="flex items-center gap-2 px-4 py-2.5 text-sm text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200">
                      <CheckCircle className="w-4 h-4" /> Segnalazione inviata
                    </div>
                  )}
                  {!currentUser && (
                    <Link to="/login" className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl ghost-border bg-surface-container hover:bg-surface-container-high transition-colors">
                      Accedi per segnalare
                    </Link>
                  )}
                  <Link to="/register" className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl ghost-border bg-surface-container hover:bg-surface-container-high transition-colors text-center justify-center">
                    <Zap className="w-4 h-4 text-primary" /> Aggiungi la tua misurazione
                  </Link>
                </div>
              </div>

              <div className="glass-panel ghost-border rounded-2xl p-5">
                <h3 className="font-headline font-bold mb-3">Stessa categoria</h3>
                {peers.length === 0 ? (
                  <p className="text-xs text-secondary">Nessun'altra misurazione per questo modello/anno.</p>
                ) : (
                  <div className="space-y-2">
                    {peers.map((p) => (
                      <Link key={p.id} to={`/vehicle/${p.id}`} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-container transition-colors group">
                        <div className="text-xs">
                          <div className="font-semibold">{p.region}</div>
                          <div className="text-secondary">{p.mileage.toLocaleString('it-IT')} km · {p.usageType}</div>
                        </div>
                        <SohBadge soh={p.soh} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── CRONOLOGIA SOH TAB ───────────────────────────────────────── */}
        {activeTab === 1 && (
          <div className="space-y-6">
            <div className="glass-panel ghost-border rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-headline font-bold text-lg">Curva di degradazione stimata</h3>
                  <p className="text-sm text-secondary">SOH simulato basato sul chilometraggio attuale</p>
                </div>
                <button className="p-2 text-secondary hover:bg-surface-container rounded-lg">
                  <Info className="w-5 h-5" />
                </button>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSoh" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-outline-variant)" opacity={0.4} />
                    <XAxis dataKey="km" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-secondary)', fontSize: 12 }} dy={10} />
                    <YAxis domain={['dataMin - 3', 100]} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-secondary)', fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-outline-variant)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(v: number) => [`${v.toFixed(2)}%`, 'SOH']} />
                    <Area type="monotone" dataKey="soh" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorSoh)" name="SOH" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {regressionLine.length > 0 && (
              <div className="glass-panel ghost-border rounded-2xl p-6">
                <h3 className="font-headline font-bold text-lg mb-1">Regressione modello</h3>
                <p className="text-sm text-secondary mb-5">Linea di regressione lineare calcolata su tutte le misurazioni approvate per {entry.oem} {entry.model} {entry.year}.</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={regressionLine} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-outline-variant)" opacity={0.4} />
                      <XAxis dataKey="mileage" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-secondary)', fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                      <YAxis domain={['dataMin - 5', 102]} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-secondary)', fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => [`${v.toFixed(2)}%`, 'SOH previsto']} labelFormatter={(v) => `${v.toLocaleString('it-IT')} km`} contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-outline-variant)' }} />
                      <Area type="monotone" dataKey="predicted" stroke="var(--color-secondary)" strokeWidth={2} strokeDasharray="5 5" fill="none" name="Regressione" />
                      <ReferenceLine y={entry.soh} stroke="var(--color-primary)" strokeWidth={2} label={{ value: `${entry.soh.toFixed(1)}%`, fill: 'var(--color-primary)', fontSize: 11 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-secondary mt-3">La linea blu indica il SOH di questa misurazione rispetto alla regressione del modello.</p>
              </div>
            )}
          </div>
        )}

        {/* ── STATISTICHE UTILIZZO TAB ─────────────────────────────────── */}
        {activeTab === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: 'Tipo di utilizzo', value: entry.usageType, desc: 'Prevalente modalità di guida dichiarata' },
              { label: 'Tipo di ricarica', value: entry.chargeType, desc: 'Modalità di ricarica prevalente' },
              { label: 'Regione geografica', value: entry.region, desc: 'Zona climatica di utilizzo' },
              { label: 'Metodo di misurazione', value: entry.measurementMethod, desc: 'Strumento/metodo usato per rilevare il SOH' },
            ].map(({ label, value, desc }) => (
              <div key={label} className="glass-panel ghost-border rounded-2xl p-6">
                <div className="text-xs text-secondary font-semibold uppercase tracking-wide mb-2">{label}</div>
                <div className="text-2xl font-headline font-bold mb-1">{value}</div>
                <div className="text-xs text-secondary">{desc}</div>
              </div>
            ))}
            <div className="glass-panel ghost-border rounded-2xl p-6 md:col-span-2">
              <div className="text-xs text-secondary font-semibold uppercase tracking-wide mb-3">Tag misurazione</div>
              <div className="flex flex-wrap gap-2">
                <TagBadge label={entry.oem} color="blue" />
                <TagBadge label={entry.model} color="blue" />
                <TagBadge label={entry.year.toString()} />
                <TagBadge label={entry.batteryModel} color="teal" />
                <TagBadge label={entry.usageType} color="purple" />
                <TagBadge label={entry.chargeType} color="purple" />
                <TagBadge label={entry.region} />
                <TagBadge label={entry.measurementMethod} color="teal" />
              </div>
            </div>
          </div>
        )}

        {/* ── NOTE COMUNITÀ TAB ────────────────────────────────────────── */}
        {activeTab === 3 && (
          <div className="space-y-6">
            <div className="glass-panel ghost-border rounded-2xl p-6">
              <h3 className="font-headline font-bold mb-4">Misurazioni simili dalla community</h3>
              {peers.length === 0 ? (
                <p className="text-secondary text-sm">Nessuna misurazione comparabile trovata nel database.</p>
              ) : (
                <div className="space-y-3">
                  {peers.map((p) => (
                    <Link key={p.id} to={`/vehicle/${p.id}`} className="flex items-center justify-between p-4 rounded-xl hover:bg-surface-container transition-colors ghost-border group">
                      <div>
                        <div className="font-semibold text-sm">{p.region} · {p.year}</div>
                        <div className="text-xs text-secondary mt-0.5">{p.mileage.toLocaleString('it-IT')} km · {p.usageType} · {p.chargeType}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <SohBadge soh={p.soh} />
                        <ArrowLeft className="w-3.5 h-3.5 text-secondary rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {entry.notes && (
              <div className="glass-panel ghost-border rounded-2xl p-6">
                <h3 className="font-headline font-bold mb-3">Note dell'autore</h3>
                <p className="text-sm text-secondary leading-relaxed">{entry.notes}</p>
              </div>
            )}

            {currentUser && !reported && (
              <button
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
              >
                <Flag className="w-4 h-4" /> Segnala dato sospetto
              </button>
            )}
          </div>
        )}
      </div>

      {/* Report Modal */}
      <Modal isOpen={reportOpen} onClose={() => setReportOpen(false)} title="Segnala dato sospetto">
        <p className="text-sm text-secondary mb-4">Descrivi il motivo per cui ritieni questo dato anomalo o non corretto.</p>
        <textarea
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
          rows={4}
          placeholder="Es: Il SOH è troppo basso per il chilometraggio dichiarato..."
          className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest ghost-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none mb-4"
        />
        <div className="flex gap-3">
          <button onClick={() => setReportOpen(false)} className="flex-1 py-2.5 ghost-border bg-surface-container rounded-xl text-sm font-medium hover:bg-surface-container-high transition-colors">
            Annulla
          </button>
          <button onClick={handleReport} disabled={!reportReason.trim()} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40">
            Invia segnalazione
          </button>
        </div>
      </Modal>
    </div>
  );
}
