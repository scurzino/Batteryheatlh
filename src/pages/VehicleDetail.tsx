import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ReferenceLine } from 'recharts';
import { ArrowLeft, ArrowRight, Car, MapPin, Zap, Activity, Info, AlertTriangle, ShieldAlert, BadgeCheck, Clock, Flag, LayoutGrid } from 'lucide-react';
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

  // New states
  const [trips, setTrips] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [myEntries, setMyEntries] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [tripForm, setTripForm] = useState({ km: '', initialSoc: '', finalSoc: '', initialEnvTemp: '', finalEnvTemp: '', chargeType: '', date: '' });
  const [isSubmittingTrip, setIsSubmittingTrip] = useState(false);

  useEffect(() => {
    if (!id) return;

    apiFetch(`/soh/${id}`)
      .then(data => {
        setEntry(data);
        return data;
      })
      .then(async (data) => {
        // Fetch peers
        const explore = await apiFetch('/soh/explore');
        const sameModel = explore.filter((e: any) =>
          e.vehicle.oem === data.vehicle.oem &&
          e.vehicle.model === data.vehicle.model
        );
        setPeers(sameModel);

        // Fetch trips & notes
        const fetchedTrips = await apiFetch(`/soh/${data.vehicle.id}/trips`);
        setTrips(fetchedTrips);

        const fetchedNotes = await apiFetch(`/soh/${data.vehicle.id}/notes`);
        setNotes(fetchedNotes);

        if (currentUser) {
            const fetchedMyEntries = await apiFetch('/soh/my-entries');
            setMyEntries(fetchedMyEntries.filter((e: any) => e.vehicleId === data.vehicle.id));
        }
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate, currentUser]);

  async function submitNote(e: React.FormEvent) {
      e.preventDefault();
      setIsSubmittingNote(true);
      try {
          const note = await apiFetch(`/soh/${entry.vehicle.id}/notes`, {
              method: 'POST',
              body: JSON.stringify({ content: newNote })
          });
          // Optimistically append note
          setNotes([{ ...note, user: { name: currentUser?.name, role: currentUser?.role } }, ...notes]);
          setNewNote('');
      } catch (err) {
          alert('Errore salvataggio nota');
      } finally {
          setIsSubmittingNote(false);
      }
  }

  async function submitTrip(e: React.FormEvent) {
      e.preventDefault();
      setIsSubmittingTrip(true);
      try {
          const trip = await apiFetch(`/soh/${entry.vehicle.id}/trips`, {
              method: 'POST',
              body: JSON.stringify(tripForm)
          });
          setTrips([trip, ...trips]);
          setTripForm({ km: '', initialSoc: '', finalSoc: '', initialEnvTemp: '', finalEnvTemp: '', chargeType: '', date: '' });
      } catch (err) {
          alert('Errore salvataggio viaggio');
      } finally {
          setIsSubmittingTrip(false);
      }
  }

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

  async function handleReport() {
    try {
      await apiFetch(`/moderation/report`, {
        method: 'POST',
        body: JSON.stringify({ entryId: entry.id, reason: reportReason })
      });
      setShowReportModal(false);
      alert('Segnalazione inviata ai moderatori.');
      setReportReason('');
    } catch (err) {
      alert("Errore nell'invio della segnalazione.");
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
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

        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
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

      <div className="flex border-b ghost-border gap-2 overflow-x-auto scrollbar-hide">
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            className={`pb-3 px-4 border-b-2 whitespace-nowrap text-sm font-medium transition-colors ${activeTab === i ? 'border-primary text-primary font-semibold' : 'border-transparent text-secondary hover:text-on-surface'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-300">
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
                        <p>Km: {d.mileage.toLocaleString()}</p>
                      </div>
                    )
                  }} />
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
            
            {(entry.minEnvTemp !== null || entry.maxEnvTemp !== null) && (
              <div className="glass-panel ghost-border rounded-xl p-5">
                <h4 className="font-bold text-sm mb-3 text-secondary">Temperature d'esercizio</h4>
                <div className="flex justify-between text-sm font-medium">
                  <div className="flex items-center gap-1 text-blue-600">Min: {entry.minEnvTemp}°C</div>
                  <div className="flex items-center gap-1 text-red-600">Max: {entry.maxEnvTemp}°C</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="glass-panel ghost-border rounded-2xl p-6 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline font-bold text-lg">La tua cronologia SOH</h3>
            {currentUser?.id === entry.userId && (
              <Link to="/register" className="px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
                Aggiungi misurazione
              </Link>
            )}
          </div>
          <div className="space-y-4">
            {myEntries.length === 0 ? <p className="text-secondary text-sm">Nessuna cronologia disponibile per questo veicolo.</p> : (
              myEntries.map((e, idx) => {
                const isDifferentMethod = idx < myEntries.length - 1 && e.measurementMethod !== myEntries[idx+1].measurementMethod;
                return (
                  <div key={e.id} className="flex justify-between items-center border-b ghost-border pb-4 last:border-0 last:pb-0">
                    <div>
                      <div className="font-bold text-on-surface text-lg">{e.soh}% SOH</div>
                      <div className="text-sm text-secondary flex gap-2">
                        <span>{new Date(e.date).toLocaleDateString()}</span>
                        <span>&bull;</span>
                        <span>{e.mileage.toLocaleString()} km</span>
                      </div>
                      <div className="text-xs text-secondary mt-1">Metodo: {e.measurementMethod}</div>
                    </div>
                    {isDifferentMethod && (
                      <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg text-xs font-semibold" title="Il metodo di misurazione è cambiato rispetto al dato cronologico precedente.">
                        <AlertTriangle className="w-3.5 h-3.5" /> Metodo variato
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-300">
          <div className="lg:col-span-2 glass-panel ghost-border rounded-2xl p-6">
            <h3 className="font-headline font-bold text-lg mb-6">Viaggi registrati</h3>
            <div className="space-y-4">
              {trips.length === 0 ? <p className="text-secondary text-sm">Nessun viaggio registrato per questo veicolo.</p> : trips.map(t => (
                <div key={t.id} className="bg-surface-container-lowest p-5 rounded-xl ghost-border text-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-lg text-primary">{t.km} km</span>
                    <span className="text-secondary font-medium">{new Date(t.date).toLocaleDateString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-secondary">
                    <div className="bg-surface rounded-lg p-2 border ghost-border">
                      <div className="text-xs font-semibold mb-1">Stato Carica (SOC)</div>
                      <div className="font-medium text-on-surface">{t.initialSoc}% <ArrowRight className="w-3 h-3 inline mx-1"/> {t.finalSoc}%</div>
                    </div>
                    <div className="bg-surface rounded-lg p-2 border ghost-border">
                      <div className="text-xs font-semibold mb-1">Temp. Ambiente</div>
                      <div className="font-medium text-on-surface">{t.initialEnvTemp}°C <ArrowRight className="w-3 h-3 inline mx-1"/> {t.finalEnvTemp}°C</div>
                    </div>
                  </div>
                  {t.chargeType && (
                    <div className="mt-3 text-tertiary font-semibold flex items-center gap-1.5 bg-tertiary-container/30 w-fit px-2 py-1 rounded-lg text-xs">
                      <Zap className="w-3.5 h-3.5"/> Ricarica: {t.chargeType}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {currentUser && (
            <div className="glass-panel ghost-border rounded-2xl p-6 h-fit sticky top-6">
              <h4 className="font-bold mb-4 text-lg">Aggiungi Viaggio</h4>
              <form onSubmit={submitTrip} className="space-y-3 text-sm">
                <input type="number" required placeholder="Km percorsi" value={tripForm.km} onChange={e => setTripForm({...tripForm, km: e.target.value})} className="w-full p-3 rounded-xl ghost-border bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none" />
                <div className="flex gap-2">
                  <input type="number" required placeholder="SOC % Iniz." value={tripForm.initialSoc} onChange={e => setTripForm({...tripForm, initialSoc: e.target.value})} className="w-1/2 p-3 rounded-xl ghost-border bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none" />
                  <input type="number" required placeholder="SOC % Fin." value={tripForm.finalSoc} onChange={e => setTripForm({...tripForm, finalSoc: e.target.value})} className="w-1/2 p-3 rounded-xl ghost-border bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
                <div className="flex gap-2">
                  <input type="number" required placeholder="Temp. Iniz. °C" value={tripForm.initialEnvTemp} onChange={e => setTripForm({...tripForm, initialEnvTemp: e.target.value})} className="w-1/2 p-3 rounded-xl ghost-border bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none" />
                  <input type="number" required placeholder="Temp. Fin. °C" value={tripForm.finalEnvTemp} onChange={e => setTripForm({...tripForm, finalEnvTemp: e.target.value})} className="w-1/2 p-3 rounded-xl ghost-border bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
                <select value={tripForm.chargeType} onChange={e => setTripForm({...tripForm, chargeType: e.target.value})} className="w-full p-3 rounded-xl ghost-border bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer">
                  <option value="">Nessuna ricarica nel mezzo</option>
                  <option value="AC">Ricarica Lenta (AC)</option>
                  <option value="DC">Ricarica Rapida (DC)</option>
                  <option value="Misto">Misto AC/DC</option>
                </select>
                <input type="date" required value={tripForm.date} onChange={e => setTripForm({...tripForm, date: e.target.value})} className="w-full p-3 rounded-xl ghost-border bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none" />
                <button type="submit" disabled={isSubmittingTrip} className="w-full bg-primary text-on-primary py-3 rounded-xl font-semibold mt-2 hover:bg-primary/90 transition-colors disabled:opacity-50">{isSubmittingTrip ? 'Salvataggio...' : 'Salva Viaggio'}</button>
              </form>
            </div>
          )}
        </div>
      )}

      {activeTab === 3 && (
        <div className="glass-panel ghost-border rounded-2xl p-6 md:p-8 animate-in slide-in-from-bottom-4 duration-300">
          <h3 className="font-headline font-bold text-lg mb-6 flex items-center gap-2"><LayoutGrid className="w-5 h-5 text-primary"/> Note della Comunità</h3>
          {currentUser && (
            <form onSubmit={submitNote} className="mb-8 flex flex-col sm:flex-row gap-3">
              <input type="text" required placeholder="Condividi un'osservazione utile su questo modello..." value={newNote} onChange={e => setNewNote(e.target.value)} className="flex-1 p-3.5 rounded-xl ghost-border bg-surface-container-lowest text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
              <button type="submit" disabled={isSubmittingNote} className="bg-primary text-on-primary px-8 py-3.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0">{isSubmittingNote ? 'Invio...' : 'Pubblica'}</button>
            </form>
          )}
          <div className="space-y-4">
            {notes.length === 0 ? <p className="text-secondary text-sm">Nessuna nota presente. Sii il primo a scriverne una!</p> : notes.map(n => (
              <div key={n.id} className="bg-surface-container-lowest p-5 rounded-xl ghost-border hover:bg-surface-container/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                    {(n.user.name || 'U').charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-on-surface">{n.user.name || 'Utente Anonimo'}</span>
                      {n.user.role === 'ADMIN' && <ShieldAlert className="w-3.5 h-3.5 text-red-500" title="Admin" />}
                    </div>
                    <div className="text-xs text-secondary">{new Date(n.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <p className="text-sm text-on-surface leading-relaxed pl-10">{n.content}</p>
              </div>
            ))}
          </div>
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
