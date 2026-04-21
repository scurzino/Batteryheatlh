import React, { useState, useMemo } from 'react';
import { ArrowUpDown, Download, ChevronUp, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_ENTRIES, OEMS, REGIONS, USAGE_TYPES, CHARGE_TYPES, FlatEntry } from '../data/mockData';
import { StatusBadge, SohBadge } from '../components/ui/Badge';

type SortField = 'soh' | 'mileage' | 'date' | 'oem' | 'model' | 'year';
type SortDir = 'asc' | 'desc';

export default function DataExplorer() {
  const [filterOem, setFilterOem] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterUsage, setFilterUsage] = useState('');
  const [filterCharge, setFilterCharge] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const filtered: FlatEntry[] = useMemo(() => {
    let list = [...MOCK_ENTRIES];
    if (filterOem) list = list.filter((e) => e.oem === filterOem);
    if (filterRegion) list = list.filter((e) => e.region === filterRegion);
    if (filterUsage) list = list.filter((e) => e.usageType === filterUsage);
    if (filterCharge) list = list.filter((e) => e.chargeType === filterCharge);
    if (filterStatus) list = list.filter((e) => e.status === filterStatus);
    list.sort((a, b) => {
      let av: string | number = a[sortField] ?? '';
      let bv: string | number = b[sortField] ?? '';
      if (sortDir === 'asc') return av < bv ? -1 : av > bv ? 1 : 0;
      return av > bv ? -1 : av < bv ? 1 : 0;
    });
    return list;
  }, [filterOem, filterRegion, filterUsage, filterCharge, filterStatus, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />;
  }

  const SELECT = "px-3 py-2 rounded-lg ghost-border bg-surface-container-lowest text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer";

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold mb-1">Data Explorer</h1>
          <p className="text-secondary text-sm">Analisi avanzata e filtraggio del dataset SOH.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 ghost-border bg-surface-container-lowest rounded-xl text-sm font-medium hover:bg-surface-container transition-colors">
          <Download className="w-4 h-4" /> Esporta CSV
        </button>
      </div>

      {/* Filters */}
      <div className="glass-panel ghost-border rounded-2xl p-5 flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-semibold text-secondary mb-1">OEM</label>
          <select value={filterOem} onChange={(e) => setFilterOem(e.target.value)} className={SELECT}>
            <option value="">Tutti</option>
            {OEMS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-secondary mb-1">Regione</label>
          <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} className={SELECT}>
            <option value="">Tutte</option>
            {REGIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-secondary mb-1">Utilizzo</label>
          <select value={filterUsage} onChange={(e) => setFilterUsage(e.target.value)} className={SELECT}>
            <option value="">Tutti</option>
            {USAGE_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-secondary mb-1">Ricarica</label>
          <select value={filterCharge} onChange={(e) => setFilterCharge(e.target.value)} className={SELECT}>
            <option value="">Tutte</option>
            {CHARGE_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-secondary mb-1">Stato</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={SELECT}>
            <option value="">Tutti</option>
            <option value="approved">Approvato</option>
            <option value="pending_moderation">In Revisione</option>
            <option value="flagged">Segnalato</option>
            <option value="rejected">Rifiutato</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel ghost-border rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b ghost-border flex items-center justify-between">
          <span className="text-sm font-semibold text-secondary">{filtered.length} risultati</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b ghost-border text-xs font-semibold text-secondary uppercase tracking-wide">
                {([
                  ['oem', 'OEM'], ['model', 'Modello'], ['year', 'Anno'],
                  ['soh', 'SOH %'], ['mileage', 'Km'],
                  ['region', 'Regione'], ['usage', 'Utilizzo'], ['charge', 'Ricarica'],
                  ['method', 'Metodo'], ['date', 'Data'], ['status', 'Stato'],
                ] as [string, string][]).map(([field, label]) => {
                  const sortable: SortField[] = ['oem', 'model', 'year', 'soh', 'mileage', 'date'];
                  const sf = field as SortField;
                  return (
                    <th key={field} className={`px-4 py-3 text-left ${sortable.includes(sf) ? 'cursor-pointer hover:text-on-surface' : ''}`}
                      onClick={() => sortable.includes(sf) && toggleSort(sf)}>
                      <div className="flex items-center gap-1">
                        {label}
                        {sortable.includes(sf) && <SortIcon field={sf} />}
                      </div>
                    </th>
                  );
                })}
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={e.id} className={`border-b ghost-border hover:bg-surface-container/50 transition-colors ${i % 2 === 0 ? '' : 'bg-surface-container/20'}`}>
                  <td className="px-4 py-3 font-semibold">{e.oem}</td>
                  <td className="px-4 py-3">{e.model}</td>
                  <td className="px-4 py-3">{e.year}</td>
                  <td className="px-4 py-3"><SohBadge soh={e.soh} /></td>
                  <td className="px-4 py-3 font-mono text-xs">{e.mileage.toLocaleString('it-IT')}</td>
                  <td className="px-4 py-3">{e.region}</td>
                  <td className="px-4 py-3">{e.usageType}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{e.chargeType}</td>
                  <td className="px-4 py-3 text-xs text-secondary">{e.measurementMethod}</td>
                  <td className="px-4 py-3 font-mono text-xs">{new Date(e.date).toLocaleDateString('it-IT')}</td>
                  <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                  <td className="px-4 py-3">
                    <Link to={`/vehicle/${e.id}`} className="text-primary text-xs font-semibold hover:underline">Dettagli</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center text-secondary">Nessun risultato con i filtri selezionati.</div>
          )}
        </div>
      </div>
    </div>
  );
}
