import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell,
} from 'recharts';
import { OEMS } from '../data/mockData';
import { apiFetch } from '../utils/api';

const TABS = ['By Model', 'Mileage vs SOH', 'By Region', 'By Charge Type', 'SOH vs Climate'];

const OEM_COLORS: Record<string, string> = {
  Tesla: '#e31937', Volkswagen: '#1d4ed8', Hyundai: '#0e4da4',
  Polestar: '#1a1a1a', BMW: '#1c69d4', Renault: '#efdf00',
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
  const [approved, setApproved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // /soh/analytics already returns only APPROVED entries flattened
    apiFetch('/soh/analytics')
      .then(setApproved)
      .finally(() => setLoading(false));
  }, []);

  // ── Climate data fetch (SOH vs Climate tab) ──
  const [climateScatter, setClimateScatter] = useState<any[]>([]);
  const [climateLoading, setClimateLoading] = useState(false);

  useEffect(() => {
    if (activeTab !== 4 || approved.length === 0 || climateScatter.length > 0) return;

    const locations = [...new Set(approved.filter(e => e.location).map(e => e.location))] as string[];
    if (locations.length === 0) return;

    setClimateLoading(true);

    const endDt = new Date();
    endDt.setDate(endDt.getDate() - 5);
    const endDateStr = endDt.toISOString().split('T')[0];
    const startDt = new Date(endDt);
    startDt.setFullYear(startDt.getFullYear() - 1);
    const startDateStr = startDt.toISOString().split('T')[0];

    Promise.all(
      locations.map(loc =>
        fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc.split(',')[0].trim())}&count=1`)
          .then(r => r.json())
          .then(geo => {
            if (!geo.results?.[0]) return null;
            const { latitude, longitude } = geo.results[0];
            return fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDateStr}&end_date=${endDateStr}&daily=temperature_2m_min&timezone=auto`)
              .then(r => r.json())
              .then(weather => {
                if (!weather?.daily?.temperature_2m_min) return null;
                const mins = weather.daily.temperature_2m_min.filter((v: any) => v !== null);
                if (mins.length === 0) return null;
                const avgMin = mins.reduce((a: number, b: number) => a + b, 0) / mins.length;
                return { location: loc, avgMinTemp: Number(avgMin.toFixed(1)) };
              });
          })
          .catch(() => null)
      )
    ).then(results => {
      const locMap: Record<string, number> = {};
      for (const r of results) {
        if (r) locMap[r.location] = r.avgMinTemp;
      }
      const points = approved
        .filter(e => e.location && locMap[e.location] !== undefined)
        .map(e => ({
          avgMinTemp: locMap[e.location],
          soh: e.soh,
          oem: e.oem,
          label: `${e.oem} ${e.model}`,
          location: e.location,
        }));
      setClimateScatter(points);
    }).finally(() => setClimateLoading(false));
  }, [activeTab, approved]);

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

  const scatterData = useMemo(() => {
    let list = approved;
    if (scatterOem) list = list.filter((e) => e.oem === scatterOem);
    return list.map((e) => ({ mileage: e.mileage, soh: e.soh, oem: e.oem, model: `${e.oem} ${e.model}` }));
  }, [approved, scatterOem]);

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
        <p className="text-secondary text-sm">Compare SOH performance by model, region, and usage mode.</p>
      </div>

      {loading ? <p>Processing data from server...</p> : (
        <>
          <div className="flex border-b ghost-border gap-1 overflow-x-auto">
            {TABS.map((tab, i) => (
              <button key={tab} onClick={() => setActiveTab(i)}
                className={`pb-3 px-4 border-b-2 whitespace-nowrap text-sm font-medium transition-colors ${activeTab === i ? 'border-primary text-primary font-semibold' : 'border-transparent text-secondary hover:text-on-surface'}`}>
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 0 && (
            <div className="glass-panel ghost-border rounded-2xl p-6">
              <h2 className="font-headline font-bold text-lg mb-1">Average SOH by Model</h2>
              <p className="text-sm text-secondary mb-6">Calculated from {approved.length} approved measurements.</p>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byModel} layout="vertical" margin={{ left: 130, right: 40, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-outline-variant)" opacity={0.4} />
                    <XAxis type="number" domain={[80, 102]} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-secondary)', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-on-surface)', fontSize: 11 }} width={130} />
                    <Tooltip content={<CustomTooltip />} formatter={(v: number) => [`${v.toFixed(2)}%`, 'Avg SOH']} />
                    <Bar dataKey="avgSoh" name="Avg SOH" radius={[0, 6, 6, 0]} barSize={18}>
                      {byModel.map((entry, i) => (
                        <Cell key={i} fill={oemColor(entry.oem)} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tab 1: Mileage vs SOH */}
          {activeTab === 1 && (
            <div className="glass-panel ghost-border rounded-2xl p-6">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="font-headline font-bold text-lg mb-1">Mileage vs SOH</h2>
                </div>
                <select value={scatterOem} onChange={(e) => setScatterOem(e.target.value)} className="px-3 py-2 rounded-lg ghost-border bg-surface-container-lowest text-sm focus:outline-none">
                  <option value="">All OEMs</option>
                  {OEMS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" opacity={0.4} />
                    <XAxis dataKey="mileage" type="number" axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} name="Km" />
                    <YAxis dataKey="soh" type="number" domain={[80, 102]} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} name="SOH" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-surface-container-lowest border rounded-xl p-3 shadow-sm text-xs">
                          <p className="font-semibold">{d.model}</p>
                          <p>SOH: <b>{d.soh}%</b></p>
                          <p>Km: <b>{d.mileage}</b></p>
                        </div>
                      );
                    }} />
                    <Scatter data={scatterData} fillOpacity={0.7}>
                      {scatterData.map((entry, i) => (
                        <Cell key={i} fill={oemColor(entry.oem)} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="glass-panel ghost-border rounded-2xl p-6">
              <h2 className="font-headline font-bold text-lg mb-1">Average SOH by Region</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byRegion} layout="vertical" margin={{ left: 130, right: 40, top: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.4} />
                    <XAxis type="number" domain={[80, 102]} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={130} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="avgSoh" fill="var(--color-primary)" radius={[0, 6, 6, 0]} barSize={16} name="Avg SOH" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 3 && (
            <div className="glass-panel ghost-border rounded-2xl p-6">
              <h2 className="font-headline font-bold text-lg mb-1">Average SOH by Charge Type</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCharge} margin={{ left: 20, right: 40, top: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.4} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} angle={-15} textAnchor="end" dy={10} />
                    <YAxis domain={[85, 100]} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="avgSoh" radius={[6, 6, 0, 0]} barSize={60} name="Avg SOH">
                      {byCharge.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? '#0ea5e9' : i === 1 ? '#f59e0b' : '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activeTab === 4 && (
            <div className="glass-panel ghost-border rounded-2xl p-6">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="font-headline font-bold text-lg mb-1">SOH vs Annual Avg. Min Temperature</h2>
                  <p className="text-sm text-secondary">Each dot is a measurement plotted against its location's yearly average daily minimum temperature. Cold climates accelerate battery degradation.</p>
                </div>
              </div>
              {climateLoading ? (
                <div className="h-80 flex items-center justify-center text-secondary text-sm animate-pulse">Fetching climate data for {new Set(approved.filter(e => e.location).map(e => e.location)).size} locations...</div>
              ) : climateScatter.length === 0 ? (
                <div className="h-80 flex items-center justify-center text-secondary text-sm">No location data available. Vehicles must have a location set to correlate with climate.</div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" opacity={0.4} />
                      <XAxis dataKey="avgMinTemp" type="number" axisLine={false} tickLine={false} name="Avg Min Temp" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}°C`} label={{ value: 'Avg Annual Min Temp (°C)', position: 'insideBottom', offset: -5, fontSize: 11, fill: 'var(--color-secondary)' }} />
                      <YAxis dataKey="soh" type="number" domain={[75, 102]} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} name="SOH" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-surface-container-lowest border rounded-xl p-3 shadow-lg text-xs">
                            <p className="font-semibold">{d.label}</p>
                            <p>SOH: <b>{d.soh}%</b></p>
                            <p>Avg Min Temp: <b>{d.avgMinTemp}°C</b></p>
                            <p className="text-secondary mt-1">{d.location}</p>
                          </div>
                        );
                      }} />
                      <Scatter data={climateScatter} fillOpacity={0.75}>
                        {climateScatter.map((entry, i) => (
                          <Cell key={i} fill={oemColor(entry.oem)} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
