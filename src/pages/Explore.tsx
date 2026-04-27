import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, ArrowRight, Battery, Gauge, MapPin, Zap, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { OEMS, COUNTRIES, USAGE_TYPES, CHARGE_TYPES, FlatEntry } from '../data/mockData';
import { StatusBadge, SohBadge, TagBadge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';

const CHARGE_ICON: Record<string, string> = {
  'Prevalentemente AC': '🔌',
  'Prevalentemente DC': '⚡',
  'Misto AC/DC': '↔️',
};

const USAGE_ICON: Record<string, string> = {
  Urbano: '🏙️', Extraurbano: '🛣️', Misto: '🔄', Autostrada: '🚗',
};

export default function Explore() {
  const { currentUser } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filterOem, setFilterOem] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterUsage, setFilterUsage] = useState('');
  const [filterCharge, setFilterCharge] = useState('');
  const [filterMinSoh, setFilterMinSoh] = useState('');
  const [sortBy, setSortBy] = useState<'soh_desc' | 'soh_asc' | 'mileage_desc' | 'date_desc'>('date_desc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    apiFetch('/soh/explore')
      .then(data => {
        const shaped = data.map((e: any) => ({
          id: e.id,
          oem: e.vehicle.oem,
          model: e.vehicle.model,
          year: e.vehicle.year,
          batteryModel: e.vehicle.batteryModel,
          region: e.region,
          usageType: e.usageType,
          chargeType: e.chargeType,
          soh: e.soh,
          mileage: e.mileage,
          measurementMethod: e.measurementMethod,
          date: e.date,
          notes: e.notes,
          status: e.status
        }));
        setEntries(shaped);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const visibleEntries: FlatEntry[] = useMemo(() => {
    let list = entries.filter((e) => e.status === 'APPROVED' || e.status === 'FLAGGED_BY_SYSTEM');
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.oem.toLowerCase().includes(q) || e.model.toLowerCase().includes(q) || e.region.toLowerCase().includes(q));
    }
    if (filterOem) list = list.filter((e) => e.oem === filterOem);
    if (filterRegion) list = list.filter((e) => e.region === filterRegion);
    if (filterUsage) list = list.filter((e) => e.usageType === filterUsage);
    if (filterCharge) list = list.filter((e) => e.chargeType === filterCharge);
    if (filterMinSoh) list = list.filter((e) => e.soh >= parseFloat(filterMinSoh));
    list.sort((a, b) => {
      if (sortBy === 'soh_desc') return b.soh - a.soh;
      if (sortBy === 'soh_asc') return a.soh - b.soh;
      if (sortBy === 'mileage_desc') return b.mileage - a.mileage;
      return b.date.localeCompare(a.date);
    });
    return list;
  }, [search, filterOem, filterRegion, filterUsage, filterCharge, filterMinSoh, sortBy, entries]);

  const approved = entries.filter((e) => e.status === 'APPROVED');
  const avgSoh = approved.length ? approved.reduce((s, e) => s + e.soh, 0) / approved.length : 0;
  const pendingCount = entries.filter((e) => e.status === 'FLAGGED_BY_SYSTEM' || e.status === 'PENDING').length;

  const hasFilters = filterOem || filterRegion || filterUsage || filterCharge || filterMinSoh;

  function clearFilters() {
    setFilterOem(''); setFilterRegion(''); setFilterUsage(''); setFilterCharge(''); setFilterMinSoh('');
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-headline font-bold mb-2">Explore Dataset</h1>
          <p className="text-secondary">Community-shared SOH measurements on real electric vehicles.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/register"
            className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Zap className="w-4 h-4" /> Add Measurement
          </Link>
        </div>
      </section>

      {/* Stats */}
      {isLoading ? <p>Loading data...</p> : (
        <>
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Measurements', value: entries.length.toString(), sub: `${approved.length} approved` },
              { label: 'Average SOH', value: `${avgSoh.toFixed(1)}%`, sub: 'across approved measurements' },
              { label: 'Under Review', value: pendingCount.toString(), sub: 'awaiting moderator' },
            ].map((stat, i) => (
              <div key={i} className="glass-panel ghost-border rounded-2xl p-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-28 h-28 bg-primary/5 rounded-full blur-3xl -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700" />
                <h3 className="text-xs font-semibold text-secondary mb-1">{stat.label}</h3>
                <div className="text-3xl font-headline font-bold text-on-surface mb-1">{stat.value}</div>
                <div className="text-xs text-secondary">{stat.sub}</div>
              </div>
            ))}
          </section>

          {/* Search & Filters */}
          <section className="space-y-3">
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input
                  type="text"
                  placeholder="Search OEM, model or region…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2.5 rounded-xl ghost-border bg-surface-container-lowest text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2.5 ghost-border rounded-xl text-sm font-medium transition-colors ${showFilters ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest hover:bg-surface-container'}`}
              >
                <Filter className="w-4 h-4" /> Filters {hasFilters && `(${[filterOem, filterRegion, filterUsage, filterCharge, filterMinSoh].filter(Boolean).length})`}
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-4 py-2.5 ghost-border bg-surface-container-lowest rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="date_desc">Most Recent</option>
                <option value="soh_desc">Highest SOH</option>
                <option value="soh_asc">Lowest SOH</option>
                <option value="mileage_desc">Highest Mileage</option>
              </select>
            </div>

            {showFilters && (
              <div className="glass-panel ghost-border rounded-2xl p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1.5">OEM</label>
                  <select value={filterOem} onChange={(e) => setFilterOem(e.target.value)} className="w-full px-3 py-2 rounded-lg ghost-border bg-surface-container-lowest text-sm focus:outline-none">
                    <option value="">All</option>
                    {OEMS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1.5">Region</label>
                  <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} className="w-full px-3 py-2 rounded-lg ghost-border bg-surface-container-lowest text-sm focus:outline-none">
                    <option value="">All</option>
                    {COUNTRIES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1.5">Usage</label>
                  <select value={filterUsage} onChange={(e) => setFilterUsage(e.target.value)} className="w-full px-3 py-2 rounded-lg ghost-border bg-surface-container-lowest text-sm focus:outline-none">
                    <option value="">All</option>
                    {USAGE_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1.5">Charging</label>
                  <select value={filterCharge} onChange={(e) => setFilterCharge(e.target.value)} className="w-full px-3 py-2 rounded-lg ghost-border bg-surface-container-lowest text-sm focus:outline-none">
                    <option value="">All</option>
                    {CHARGE_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1.5">Min SOH (%)</label>
                  <input type="number" min="0" max="100" value={filterMinSoh} onChange={(e) => setFilterMinSoh(e.target.value)} placeholder="e.g. 90" className="w-full px-3 py-2 rounded-lg ghost-border bg-surface-container-lowest text-sm focus:outline-none" />
                </div>
                {hasFilters && (
                  <div className="col-span-full flex justify-end">
                    <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-secondary hover:text-on-surface font-medium">
                      <X className="w-3 h-3" /> Clear Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Entry Cards */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-headline font-bold">
                {visibleEntries.length} measurement{visibleEntries.length !== 1 ? 's' : ''}
              </h2>
            </div>
            {visibleEntries.length === 0 ? (
              <div className="glass-panel ghost-border rounded-2xl p-12 text-center text-secondary">
                <Battery className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p>No measurements found with the selected filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {visibleEntries.map((entry) => (
                  <Link
                    to={`/vehicle/${entry.id}`}
                    key={entry.id}
                    className={`glass-panel ghost-border rounded-2xl p-5 flex flex-col gap-3 hover:shadow-lg transition-all group ${entry.status === 'FLAGGED_BY_SYSTEM' ? 'border-amber-300/40' : ''}`}
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-secondary mb-0.5">{entry.oem}</div>
                        <h3 className="font-headline font-bold text-lg leading-tight">{entry.model} <span className="font-medium text-secondary">{entry.year}</span></h3>
                        <div className="text-xs text-secondary mt-0.5">{entry.batteryModel}</div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1.5">
                        <SohBadge soh={entry.soh} />
                        <StatusBadge status={entry.status} />
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap gap-2">
                      <TagBadge label={`${USAGE_ICON[entry.usageType]} ${entry.usageType}`} color="blue" />
                      <TagBadge label={`${CHARGE_ICON[entry.chargeType]} ${entry.chargeType}`} color="purple" />
                      <TagBadge label={entry.measurementMethod} color="teal" />
                    </div>

                    <div className="flex items-center justify-between text-sm pt-1 border-t ghost-border">
                      <div className="flex items-center gap-3 text-secondary">
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{entry.region}</span>
                        <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5" />{entry.mileage.toLocaleString('en-US')} km</span>
                      </div>
                      <div className="flex items-center gap-1 text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs">Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
