import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Legend, Cell,
} from 'recharts';
import { MOCK_ENTRIES, OEMS } from '../data/mockData';

const TABS = ['Per Modello', 'Mileage vs SOH', 'Per Regione', 'Per Tipo Ricarica'];

const OEM_COLORS: Record<string, string> = {
  Tesla: '#e31937',
  Volkswagen: '#1d4ed8',
  Hyundai: '#0e4da4',
  Polestar: '#1a1a1a',
  BMW: '#1c69d4',
  Renault: '#efdf00',
};
function oemColor(oem: string) { return OEM_COLORS[oem] ?? '#6366f1'; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="text-xs">
          {p.name}: <span className="font-bold">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function Benchmarks() {
  const [activeTab, setActiveTab] = useState(0);
  const [scatterOem, setScatterOem] = useState('');
  const approved = MOCK_ENTRIES.filter((e) => e.status === 'approved');

  // Tab 0: avg SOH per OEM + model
  const byModel = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    approved.forEach((e) => {
      const key = `${e.oem} ${e.model} (${e.year})`;
      if (!map[key]) map[key] = { total: 0, count: 0 };
      map[key].total += e.soh;
      map[key].count++;
    });
    return Object.entries(map)
      .map(([key, { total, count }]) => ({ name: key, avgSoh: parseFloat((total / count).toFixed(2)), oem: key.split(' ')[0] }))
      .sort((a, b) => b.avgSoh - a.avgSoh);
  }, [approved]);

  // Tab 1: scatter mileage vs SOH
  const scatterData = useMemo(() => {
    let list = approved;
    if (scatterOem) list = list.filter((e) => e.oem === scatterOem);
    return list.map((e) => ({ mileage: e.mileage, soh: e.soh, oem: e.oem, model: `${e.oem} ${e.model}` }));
  }, [approved, scatterOem]);

  // Tab 2: avg SOH per region
  const byRegion = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    approved.forEach((e) => {
      if (!map[e.region]) map[e.region] = { total: 0, count: 0 };
      map[e.region].total += e.soh;
      map[e.region].count++;
    });
    return Object.entries(map)
      .map(([name, { total, count }]) => ({ name, avgSoh: parseFloat((total / count).toFixed(2)), count }))
      .sort((a, b) => b.avgSoh - a.avgSoh);
  }, [approved]);

  // Tab 3: avg SOH per charge type
  const byCharge = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    approved.forEach((e) => {
      if (!map[e.chargeType]) map[e.chargeType] = { total: 0, count: 0 };
      map[e.chargeType].total += e.soh;
      map[e.chargeType].count++;
    });
    return Object.entries(map)
      .map(([name, { total, count }]) => ({ name, avgSoh: parseFloat((total / count).toFixed(2)), count }))
      .sort((a, b) => b.avgSoh - a.avgSoh);
  }, [approved]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold mb-1">Benchmarks</h1>
        <p className="text-secondary text-sm">Confronta le performance SOH per modello, regione e modalità d'uso.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b ghost-border gap-1 overflow-x-auto">
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            className={`pb-3 px-4 border-b-2 whitespace-nowrap text-sm font-medium transition-colors ${activeTab === i ? 'border-primary text-primary font-semibold' : 'border-transparent text-secondary hover:text-on-surface'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab 0: Per Modello ─────────────────────────────────────────────── */}
      {activeTab === 0 && (
        <div className="glass-panel ghost-border rounded-2xl p-6">
          <h2 className="font-headline font-bold text-lg mb-1">SOH medio per modello</h2>
          <p className="text-sm text-secondary mb-6">Calcolato su {approved.length} misurazioni approvate.</p>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byModel} layout="vertical" margin={{ left: 130, right: 40, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-outline-variant)" opacity={0.4} />
                <XAxis type="number" domain={[80, 102]} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-secondary)', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-on-surface)', fontSize: 11 }} width={130} />
                <Tooltip content={<CustomTooltip />} formatter={(v: number) => [`${v.toFixed(2)}%`, 'SOH medio']} />
                <Bar dataKey="avgSoh" name="SOH medio" radius={[0, 6, 6, 0]} barSize={18}>
                  {byModel.map((entry, i) => (
                    <Cell key={i} fill={oemColor(entry.oem)} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            {Object.entries(OEM_COLORS).filter(([oem]) => OEMS.includes(oem)).map(([oem, color]) => (
              <div key={oem} className="flex items-center gap-1.5 text-xs font-medium text-secondary">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                {oem}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab 1: Mileage vs SOH ─────────────────────────────────────────── */}
      {activeTab === 1 && (
        <div className="glass-panel ghost-border rounded-2xl p-6">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h2 className="font-headline font-bold text-lg mb-1">Chilometraggio vs SOH</h2>
              <p className="text-sm text-secondary">Dispersione delle misurazioni approvate.</p>
            </div>
            <select value={scatterOem} onChange={(e) => setScatterOem(e.target.value)} className="px-3 py-2 rounded-lg ghost-border bg-surface-container-lowest text-sm focus:outline-none">
              <option value="">Tutti gli OEM</option>
              {OEMS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" opacity={0.4} />
                <XAxis dataKey="mileage" type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-secondary)', fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k km`} name="Km" />
                <YAxis dataKey="soh" type="number" domain={[80, 102]} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-secondary)', fontSize: 11 }} tickFormatter={(v) => `${v}%`} name="SOH" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-3 shadow-lg text-xs">
                      <p className="font-semibold">{d.model}</p>
                      <p>SOH: <b>{d.soh}%</b></p>
                      <p>Km: <b>{d.mileage.toLocaleString('it-IT')}</b></p>
                    </div>
                  );
                }} />
                <Scatter data={scatterData} fill="var(--color-primary)" fillOpacity={0.7}>
                  {scatterData.map((entry, i) => (
                    <Cell key={i} fill={oemColor(entry.oem)} fillOpacity={0.8} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-secondary mt-3">{scatterData.length} misurazioni visualizzate{scatterOem ? ` (${scatterOem})` : ''}.</p>
        </div>
      )}

      {/* ── Tab 2: Per Regione ─────────────────────────────────────────────── */}
      {activeTab === 2 && (
        <div className="glass-panel ghost-border rounded-2xl p-6">
          <h2 className="font-headline font-bold text-lg mb-1">SOH medio per regione</h2>
          <p className="text-sm text-secondary mb-6">Confronto geografico su {approved.length} misurazioni approvate.</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byRegion} layout="vertical" margin={{ left: 130, right: 40, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-outline-variant)" opacity={0.4} />
                <XAxis type="number" domain={[80, 102]} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-secondary)', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-on-surface)', fontSize: 11 }} width={130} />
                <Tooltip content={<CustomTooltip />} formatter={(v: number) => [`${v.toFixed(2)}%`, 'SOH medio']} />
                <Bar dataKey="avgSoh" fill="var(--color-primary)" radius={[0, 6, 6, 0]} barSize={16} name="SOH medio" fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Tab 3: Per Tipo Ricarica ───────────────────────────────────────── */}
      {activeTab === 3 && (
        <div className="glass-panel ghost-border rounded-2xl p-6">
          <h2 className="font-headline font-bold text-lg mb-1">SOH medio per tipo di ricarica</h2>
          <p className="text-sm text-secondary mb-6">Impatto delle diverse modalità di ricarica sull'SOH.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCharge} margin={{ left: 20, right: 40, top: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-outline-variant)" opacity={0.4} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-on-surface)', fontSize: 11 }} angle={-15} textAnchor="end" dy={10} />
                <YAxis domain={[85, 100]} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-secondary)', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<CustomTooltip />} formatter={(v: number) => [`${v.toFixed(2)}%`, 'SOH medio']} />
                <Bar dataKey="avgSoh" fill="var(--color-tertiary-container)" radius={[6, 6, 0, 0]} barSize={60} name="SOH medio">
                  {byCharge.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? '#0ea5e9' : i === 1 ? '#f59e0b' : '#6366f1'} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {byCharge.map((item, i) => (
              <div key={item.name} className="glass-panel ghost-border rounded-xl p-4 text-center">
                <div className="text-xs text-secondary mb-1 font-semibold">{item.name}</div>
                <div className="text-3xl font-headline font-bold">{item.avgSoh.toFixed(1)}%</div>
                <div className="text-xs text-secondary mt-1">{item.count} misurazion{item.count === 1 ? 'e' : 'i'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
