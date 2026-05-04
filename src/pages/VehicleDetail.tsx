import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ReferenceLine } from 'recharts';
import { ArrowLeft, ArrowRight, Car, MapPin, Zap, Activity, Info, AlertTriangle, ShieldAlert, BadgeCheck, Clock, Flag, LayoutGrid } from 'lucide-react';
import { StatusBadge, SohBadge, TagBadge } from '../components/ui/Badge';
import { getRegressionLine } from '../utils/regressionCheck';
import Modal from '../components/ui/Modal';
import { LocationSearch } from '../components/ui/LocationSearch';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

const TABS = ['Overview', 'SOH History', 'Usage Stats', 'Community Notes'];

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({ grossCapacity: '', netCapacity: '', location: '', measurementTemp: '' });
  const [climateData, setClimateData] = useState<any[]>([]);
  const [showAddSohModal, setShowAddSohModal] = useState(false);
  const [addSohForm, setAddSohForm] = useState({ soh: '', mileage: '', measurementMethod: '', measurementTemp: '', date: new Date().toISOString().split('T')[0], notes: '' });
  const [isSubmittingSoh, setIsSubmittingSoh] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [hiddenMethods, setHiddenMethods] = useState<string[]>([]);

  const METHOD_COLORS: Record<string, string> = {
    'OBD2 Dongle': '#3b82f6',
    'Charge Data (API)': '#10b981',
    'SoC Check': '#8b5cf6',
    'OEM Certificate': '#f59e0b',
    'Other': '#64748b'
  };

  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [peers, setPeers] = useState<any[]>([]);

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
        setUpdateForm({
          grossCapacity: data.vehicle.grossCapacity?.toString() || '',
          netCapacity: data.vehicle.netCapacity?.toString() || '',
          location: data.vehicle.location || '',
          measurementTemp: data.measurementTemp?.toString() || ''
        });
        
        if (data.vehicle.location) {
          fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(data.vehicle.location)}&count=1`)
            .then(r => r.json())
            .then(geo => {
              if (geo.results?.[0]) {
                const { latitude, longitude } = geo.results[0];
                return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&past_days=90&forecast_days=0&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
              }
            })
            .then(r => r ? r.json() : null)
            .then(weather => {
              if (weather?.daily) {
                const arr = weather.daily.time.map((t: string, i: number) => ({
                  date: new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  max: weather.daily.temperature_2m_max[i],
                  min: weather.daily.temperature_2m_min[i]
                }));
                // Downsample for cleaner chart if too many points
                setClimateData(arr.filter((_: any, i: number) => i % 3 === 0));
              }
            }).catch(console.error);
        }
        setAddSohForm(prev => ({
          ...prev,
          measurementMethod: data.measurementMethod || '',
          measurementTemp: data.measurementTemp?.toString() || ''
        }));
        return data;
      })
      .then(async (data) => {
        const explore = await apiFetch('/soh/explore');
        const sameModel = explore.filter((e: any) =>
          e.vehicle.oem === data.vehicle.oem &&
          e.vehicle.model === data.vehicle.model
        );
        setPeers(sameModel);

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
      setNotes([{ ...note, user: { name: currentUser?.name, role: currentUser?.role } }, ...notes]);
      setNewNote('');
    } catch (err) {
      alert('Error saving note');
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
      alert('Error saving trip');
    } finally {
      setIsSubmittingTrip(false);
    }
  }

  async function updateMetadata(e: React.FormEvent) {
    e.preventDefault();
    try {
      const vehicleUpdated = await apiFetch(`/soh/vehicle/${entry.vehicle.id}/metadata`, {
        method: 'PUT',
        body: JSON.stringify({
          grossCapacity: updateForm.grossCapacity,
          netCapacity: updateForm.netCapacity,
          location: updateForm.location
        })
      });

      const entryUpdated = await apiFetch(`/soh/entry/${entry.id}/metadata`, {
        method: 'PUT',
        body: JSON.stringify({ measurementTemp: updateForm.measurementTemp })
      });

      setEntry({ ...entryUpdated, vehicle: vehicleUpdated });
      setShowUpdateModal(false);
      alert('Data updated successfully!');
    } catch (err) {
      alert('Error updating data');
    }
  }

  async function submitAddSoh(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmittingSoh(true);
    try {
      const response = await apiFetch('/soh/entry', {
        method: 'POST',
        body: JSON.stringify({
          ...addSohForm,
          vehicleId: entry.vehicle.id,
          region: entry.region,
          usageType: entry.usageType,
          chargeType: entry.chargeType,
          oem: entry.vehicle.oem,
          model: entry.vehicle.model,
          year: entry.vehicle.year,
          batteryModel: entry.vehicle.batteryModel
        })
      });
      const fetchedMyEntries = await apiFetch('/soh/my-entries');
      setMyEntries(fetchedMyEntries.filter((e: any) => e.vehicleId === entry.vehicle.id));
      setShowAddSohModal(false);
      alert('New measurement added!');
    } catch (err) {
      alert('Error adding measurement');
    } finally {
      setIsSubmittingSoh(false);
    }
  }

  if (loading) return <div className="p-12 text-center">Loading vehicle...</div>;
  if (!entry) return null;

  const regressionLine = getRegressionLine(
    peers
      .filter(p => p.status === 'APPROVED')
      .map(p => ({ soh: p.soh, mileage: p.mileage }))
  );

  const peerData = peers
    .filter(p => p.id !== entry.id && p.status === 'APPROVED')
    .map(p => ({ mileage: p.mileage, soh: p.soh, type: 'community', method: p.measurementMethod }));

  peerData.push({ mileage: entry.mileage, soh: entry.soh, type: 'current', method: entry.measurementMethod });

  const allMethods = Array.from(new Set(peerData.map(d => d.method).filter(Boolean)));

  async function handleReport() {
    try {
      await apiFetch(`/moderation/report`, {
        method: 'POST',
        body: JSON.stringify({ entryId: entry.id, reason: reportReason })
      });
      setShowReportModal(false);
      alert('Report submitted to moderators.');
      setReportReason('');
    } catch (err) {
      alert('Error submitting report.');
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header & Back */}
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-sm text-secondary hover:text-on-surface font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Explore
        </Link>
        <div className="flex gap-2">
          {currentUser && currentUser.id === entry.userId && (
            (!entry.vehicle.grossCapacity || !entry.vehicle.netCapacity || !entry.vehicle.location || entry.measurementTemp === null)
          ) && (
              <button onClick={() => setShowUpdateModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors animate-pulse shadow-sm">
                <Activity className="w-3.5 h-3.5" /> Complete Missing Data
              </button>
            )}
          {currentUser && currentUser.id !== entry.userId && entry.status === 'APPROVED' && (
            <button onClick={() => setShowReportModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors">
              <Flag className="w-3.5 h-3.5" /> Report Data
            </button>
          )}
          {isAdmin && entry.status === 'APPROVED' && (
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors">
              <ShieldAlert className="w-3.5 h-3.5" /> Hide (Admin)
            </button>
          )}
        </div>
      </div>

      {entry.status === 'FLAGGED_BY_SYSTEM' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="text-sm">
            <span className="font-bold block mb-0.5">Measurement Under Automated Analysis</span>
            The submitted data deviates from the expected average for this model. A moderator will review its authenticity shortly.
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
              <div className="text-xs font-semibold text-secondary mb-1">Mileage</div>
              <div className="text-2xl font-headline font-bold text-on-surface">{entry.mileage.toLocaleString('en-US')} <span className="text-base text-secondary font-medium">km</span></div>
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
            <h3 className="font-headline font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> Community Degradation Curve</h3>
            <p className="text-xs text-secondary mb-6">Comparison of this vehicle (red dot) against the optimal degradation curve and measurements from other users (grey dots).</p>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" opacity={0.4} />
                  <XAxis dataKey="mileage" type="number" axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="soh" type="number" domain={[80, 105]} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    if (d.type === 'regression') return <div className="bg-surface-container-low text-xs p-2 rounded shadow">Predicted Regression: {d.soh.toFixed(1)}%</div>;
                    return (
                      <div className="bg-surface-container-lowest border rounded-xl p-3 shadow-lg text-xs">
                        <p className="font-bold">{d.type === 'current' ? 'Focused Measurement' : 'Community User'}</p>
                        <p>SOH: {d.soh}%</p>
                        <p>Km: {d.mileage.toLocaleString()}</p>
                        {d.method && <p className="text-secondary mt-1">Method: {d.method}</p>}
                      </div>
                    )
                  }} />
                  <Scatter name="Regression" data={regressionLine} fill="var(--color-primary)" opacity={0.3} shape="square" />

                  {allMethods.map(m => !hiddenMethods.includes(String(m)) && (
                    <Scatter
                      key={String(m)}
                      name={String(m)}
                      data={peerData.filter(d => d.method === m && d.type !== 'current')}
                      fill={METHOD_COLORS[String(m)] || '#94a3b8'}
                      opacity={0.6}
                    />
                  ))}

                  <Scatter name="Current" data={peerData.filter(d => d.type === 'current')} fill="var(--color-error, #dc2626)" opacity={1} shape="star" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {allMethods.map(m => {
                const method = String(m);
                const isHidden = hiddenMethods.includes(method);
                return (
                  <button
                    key={method}
                    onClick={() => setHiddenMethods(prev => isHidden ? prev.filter(x => x !== method) : [...prev, method])}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border flex items-center gap-2 transition-colors ${isHidden ? 'bg-surface text-secondary border-outline-variant opacity-50' : 'bg-surface-container border-outline text-on-surface shadow-sm'}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: isHidden ? 'transparent' : (METHOD_COLORS[method] || '#94a3b8'), border: `1px solid ${METHOD_COLORS[method] || '#94a3b8'}` }} />
                    {method}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-panel ghost-border rounded-xl p-5">
              <h4 className="font-bold text-sm mb-3 text-secondary">Usage Profile</h4>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="flex justify-between mb-1"><span className="text-secondary flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Type</span><span className="font-medium">{entry.usageType}</span></div>
                  <div className="w-full bg-surface-container rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full w-2/3" /></div>
                </div>
                <div>
                  <div className="flex justify-between mb-1"><span className="text-secondary flex items-center gap-1.5"><Zap className="w-4 h-4" /> Charging</span><span className="font-medium">{entry.chargeType}</span></div>
                  <div className="w-full bg-surface-container rounded-full h-1.5"><div className="bg-tertiary-container h-1.5 rounded-full w-4/5" /></div>
                </div>
              </div>
            </div>

            {(entry.vehicle.location || entry.measurementTemp !== null) && (
              <div className="glass-panel ghost-border rounded-xl p-5">
                <h4 className="font-bold text-sm mb-3 text-secondary">Operating Temperatures</h4>
                <div className="flex flex-col gap-4 text-sm font-medium">
                  {entry.vehicle.location && (
                    <div className="bg-surface-container-lowest rounded-lg border ghost-border p-4">
                      <div className="flex items-center gap-1.5 mb-3 text-on-surface">
                        <MapPin className="w-4 h-4 text-primary" /> Location: {entry.vehicle.location}
                      </div>
                      {climateData.length > 0 ? (
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={climateData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                              <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} minTickGap={20} />
                              <YAxis tick={{fontSize: 10}} tickLine={false} axisLine={false} width={40} />
                              <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                              <Area type="monotone" dataKey="max" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} name="Max °C" />
                              <Area type="monotone" dataKey="min" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name="Min °C" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="text-xs text-secondary animate-pulse">Loading climate data...</div>
                      )}
                    </div>
                  )}
                  {entry.measurementTemp !== null && entry.measurementTemp !== undefined && (
                    <div className="flex justify-between items-center p-3 bg-surface-container-lowest rounded-lg border ghost-border text-on-surface">
                      <div className="flex items-center gap-1 text-secondary">Measured During Test:</div>
                      <div className="font-bold text-lg">{entry.measurementTemp}°C</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 1 && (
        <div className="glass-panel ghost-border rounded-2xl p-6 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline font-bold text-lg">Your SOH History</h3>
            {currentUser?.id === entry.userId && (
              <button onClick={() => setShowAddSohModal(true)} className="px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
                Add Measurement
              </button>
            )}
          </div>
          <div className="space-y-4">
            {myEntries.length === 0 ? <p className="text-secondary text-sm">No history available for this vehicle.</p> : (
              <div className="h-64 mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[...myEntries].sort((a, b) => a.mileage - b.mileage)} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="mileage" type="number" domain={['dataMin', 'dataMax']} tickFormatter={v => `${(v/1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
                    <YAxis domain={['auto', 'auto']} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelFormatter={v => `${Number(v).toLocaleString()} km`}
                      formatter={(val: number, name: string, props: any) => [`${val}% (Method: ${props.payload.measurementMethod})`, 'SOH']}
                    />
                    <Area type="monotone" dataKey="soh" stroke="var(--color-primary)" strokeWidth={3} fill="var(--color-primary)" fillOpacity={0.1} activeDot={{ r: 6 }} dot={{ r: 4, fill: "var(--color-primary)", strokeWidth: 2, stroke: "#fff" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-300">
          <div className="lg:col-span-2 glass-panel ghost-border rounded-2xl p-6">
            <h3 className="font-headline font-bold text-lg mb-6">Recorded Trips</h3>
            <div className="space-y-4">
              {trips.length === 0 ? <p className="text-secondary text-sm">No trips recorded for this vehicle.</p> : trips.map(t => (
                <div key={t.id} className="bg-surface-container-lowest p-5 rounded-xl ghost-border text-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-lg text-primary">{t.km} km</span>
                    <span className="text-secondary font-medium">{new Date(t.date).toLocaleDateString()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-secondary">
                    <div className="bg-surface rounded-lg p-2 border ghost-border">
                      <div className="text-xs font-semibold mb-1">State of Charge (SOC)</div>
                      <div className="font-medium text-on-surface">{t.initialSoc}% <ArrowRight className="w-3 h-3 inline mx-1" /> {t.finalSoc}%</div>
                    </div>
                    <div className="bg-surface rounded-lg p-2 border ghost-border">
                      <div className="text-xs font-semibold mb-1">Ambient Temp.</div>
                      <div className="font-medium text-on-surface">{t.initialEnvTemp}°C <ArrowRight className="w-3 h-3 inline mx-1" /> {t.finalEnvTemp}°C</div>
                    </div>
                  </div>
                  {t.chargeType && (
                    <div className="mt-3 text-tertiary font-semibold flex items-center gap-1.5 bg-tertiary-container/30 w-fit px-2 py-1 rounded-lg text-xs">
                      <Zap className="w-3.5 h-3.5" /> Charging: {t.chargeType}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {currentUser && (
            <div className="glass-panel ghost-border rounded-2xl p-6 h-fit sticky top-6">
              <h4 className="font-bold mb-4 text-lg">Add Trip</h4>
              <form onSubmit={submitTrip} className="space-y-3 text-sm">
                <input type="number" required placeholder="Km driven" value={tripForm.km} onChange={e => setTripForm({ ...tripForm, km: e.target.value })} className="w-full p-3 rounded-xl ghost-border bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none" />
                <div className="flex gap-2">
                  <input type="number" required placeholder="SOC % Start" value={tripForm.initialSoc} onChange={e => setTripForm({ ...tripForm, initialSoc: e.target.value })} className="w-1/2 p-3 rounded-xl ghost-border bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none" />
                  <input type="number" required placeholder="SOC % End" value={tripForm.finalSoc} onChange={e => setTripForm({ ...tripForm, finalSoc: e.target.value })} className="w-1/2 p-3 rounded-xl ghost-border bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
                <div className="flex gap-2">
                  <input type="number" required placeholder="Start Temp °C" value={tripForm.initialEnvTemp} onChange={e => setTripForm({ ...tripForm, initialEnvTemp: e.target.value })} className="w-1/2 p-3 rounded-xl ghost-border bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none" />
                  <input type="number" required placeholder="End Temp °C" value={tripForm.finalEnvTemp} onChange={e => setTripForm({ ...tripForm, finalEnvTemp: e.target.value })} className="w-1/2 p-3 rounded-xl ghost-border bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>
                <select value={tripForm.chargeType} onChange={e => setTripForm({ ...tripForm, chargeType: e.target.value })} className="w-full p-3 rounded-xl ghost-border bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer">
                  <option value="">No mid-trip charging</option>
                  <option value="AC">Slow Charge (AC)</option>
                  <option value="DC">Fast Charge (DC)</option>
                  <option value="Mixed">Mixed AC/DC</option>
                </select>
                <input type="date" required value={tripForm.date} onChange={e => setTripForm({ ...tripForm, date: e.target.value })} className="w-full p-3 rounded-xl ghost-border bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none" />
                <button type="submit" disabled={isSubmittingTrip} className="w-full bg-primary text-on-primary py-3 rounded-xl font-semibold mt-2 hover:bg-primary/90 transition-colors disabled:opacity-50">{isSubmittingTrip ? 'Saving...' : 'Save Trip'}</button>
              </form>
            </div>
          )}
        </div>
      )}

      {activeTab === 3 && (
        <div className="glass-panel ghost-border rounded-2xl p-6 md:p-8 animate-in slide-in-from-bottom-4 duration-300">
          <h3 className="font-headline font-bold text-lg mb-6 flex items-center gap-2"><LayoutGrid className="w-5 h-5 text-primary" /> Community Notes</h3>
          {currentUser && (
            <form onSubmit={submitNote} className="mb-8 flex flex-col sm:flex-row gap-3">
              <input type="text" required placeholder="Share a useful observation about this model..." value={newNote} onChange={e => setNewNote(e.target.value)} className="flex-1 p-3.5 rounded-xl ghost-border bg-surface-container-lowest text-sm focus:ring-2 focus:ring-primary/20 outline-none" />
              <button type="submit" disabled={isSubmittingNote} className="bg-primary text-on-primary px-8 py-3.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0">{isSubmittingNote ? 'Posting...' : 'Publish'}</button>
            </form>
          )}
          <div className="space-y-4">
            {notes.length === 0 ? <p className="text-secondary text-sm">No notes yet. Be the first to write one!</p> : notes.map(n => (
              <div key={n.id} className="bg-surface-container-lowest p-5 rounded-xl ghost-border hover:bg-surface-container/50 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                    {(n.user.name || 'U').charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-on-surface">{n.user.name || 'Anonymous User'}</span>
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

      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="Report Measurement">
        <div className="space-y-4 text-sm">
          <p className="text-secondary">Do you think this data is incorrect, manipulated, or impossible? Explain the reason, and a moderator will review the report.</p>
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full p-3 rounded-xl ghost-border bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none h-24"
            placeholder="e.g. The SOH for this model after 100k km cannot be 100%..."
          />
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowReportModal(false)} className="px-4 py-2 font-medium text-secondary hover:text-on-surface">Cancel</button>
            <button onClick={handleReport} disabled={!reportReason.trim()} className="px-4 py-2 bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">Submit Report</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} title="Complete Technical Data">
        <form onSubmit={updateMetadata} className="space-y-4 text-sm">
          <p className="text-secondary">New fields are available to improve the accuracy of analyses. Enter the missing data for this record.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(!entry.vehicle.grossCapacity || !entry.vehicle.netCapacity) && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1">Gross Capacity (kWh)</label>
                  <input type="number" step="0.1" required value={updateForm.grossCapacity} onChange={(e) => setUpdateForm({ ...updateForm, grossCapacity: e.target.value })}
                    className="w-full p-3 rounded-xl ghost-border bg-surface-container-lowest outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. 77.4" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1">Net Capacity (kWh)</label>
                  <input type="number" step="0.1" required value={updateForm.netCapacity} onChange={(e) => setUpdateForm({ ...updateForm, netCapacity: e.target.value })}
                    className="w-full p-3 rounded-xl ghost-border bg-surface-container-lowest outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. 74.0" />
                </div>
              </>
            )}
            {!entry.vehicle.location && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-secondary mb-1">Primary Location (City, Country)</label>
                <LocationSearch value={updateForm.location} onChange={(val) => setUpdateForm({ ...updateForm, location: val })} placeholder="e.g. Milan, Italy" />
              </div>
            )}
            {entry.measurementTemp === null && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-secondary mb-1">Battery pack temperature at time of test (°C)</label>
                <input type="number" required value={updateForm.measurementTemp} onChange={(e) => setUpdateForm({ ...updateForm, measurementTemp: e.target.value })}
                  className="w-full p-3 rounded-xl ghost-border bg-surface-container-lowest outline-none focus:ring-2 focus:ring-primary/20" placeholder="25" />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowUpdateModal(false)} className="px-4 py-2 font-medium text-secondary hover:text-on-surface">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary/90 transition-colors">Save Data</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showAddSohModal} onClose={() => setShowAddSohModal(false)} title="New SOH Measurement">
        <form onSubmit={submitAddSoh} className="space-y-4 text-sm">
          <p className="text-secondary font-medium">Vehicle: <span className="text-on-surface">{entry.vehicle.oem} {entry.vehicle.model}</span></p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">SOH (%)</label>
              <input type="number" step="0.1" required value={addSohForm.soh} onChange={(e) => setAddSohForm({ ...addSohForm, soh: e.target.value })}
                className="w-full p-3 rounded-xl ghost-border bg-surface-container-lowest outline-none focus:ring-2 focus:ring-primary/20" placeholder="98.5" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">Total Km</label>
              <input type="number" required value={addSohForm.mileage} onChange={(e) => setAddSohForm({ ...addSohForm, mileage: e.target.value })}
                className="w-full p-3 rounded-xl ghost-border bg-surface-container-lowest outline-none focus:ring-2 focus:ring-primary/20" placeholder="25000" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">Method</label>
              <select value={addSohForm.measurementMethod} onChange={(e) => setAddSohForm({ ...addSohForm, measurementMethod: e.target.value })}
                className="w-full p-3 rounded-xl ghost-border bg-surface-container-lowest outline-none focus:ring-2 focus:ring-primary/20">
                <option value="OBD2 Dongle">OBD2 Dongle</option>
                <option value="Charge Data (API)">Charge Data (API)</option>
                <option value="SoC Check">SoC Check</option>
                <option value="OEM Certificate">OEM Certificate</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">Battery Temp (°C)</label>
              <input type="number" required value={addSohForm.measurementTemp} onChange={(e) => setAddSohForm({ ...addSohForm, measurementTemp: e.target.value })}
                className="w-full p-3 rounded-xl ghost-border bg-surface-container-lowest outline-none focus:ring-2 focus:ring-primary/20" placeholder="25" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-secondary mb-1">Measurement Date</label>
              <input type="date" required value={addSohForm.date} onChange={(e) => setAddSohForm({ ...addSohForm, date: e.target.value })}
                className="w-full p-3 rounded-xl ghost-border bg-surface-container-lowest outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-secondary mb-1">Notes (optional)</label>
              <textarea value={addSohForm.notes} onChange={(e) => setAddSohForm({ ...addSohForm, notes: e.target.value })}
                className="w-full p-3 rounded-xl ghost-border bg-surface-container-lowest outline-none focus:ring-2 focus:ring-primary/20 h-20 resize-none" placeholder="Some details about the test..." />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAddSohModal(false)} className="px-4 py-2 font-medium text-secondary hover:text-on-surface">Cancel</button>
            <button type="submit" disabled={isSubmittingSoh} className="px-4 py-2 bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
              {isSubmittingSoh ? 'Saving...' : 'Confirm Measurement'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
