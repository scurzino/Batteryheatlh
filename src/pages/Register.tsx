import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, CheckCircle, Car, MapPin, Zap, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  OEMS, REGIONS, USAGE_TYPES, CHARGE_TYPES, MEASUREMENT_METHODS,
  MOCK_ENTRIES, FlatEntry, UsageType, ChargeType, MeasurementMethod,
} from '../data/mockData';
import { checkRegression } from '../utils/regressionCheck';

// ── Step indicator ────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Veicolo', icon: Car },
  { label: 'Utilizzo', icon: MapPin },
  { label: 'SOH', icon: Activity },
  { label: 'Conferma', icon: CheckCircle },
];

// ── Battery model suggestions per OEM ────────────────────────────────────
const BATTERY_SUGGESTIONS: Record<string, string[]> = {
  Tesla: ['LFP 57.5 kWh', 'LFP 60 kWh', 'NCA 75 kWh', 'NCA 100 kWh'],
  Volkswagen: ['NCM 58 kWh', 'NCM 77 kWh', 'LFP 77 kWh'],
  Hyundai: ['NCM 72.6 kWh', 'NCM 58 kWh'],
  Polestar: ['NMC 78 kWh', 'NMC 82 kWh'],
  BMW: ['NCM 80 kWh', 'NCM 66 kWh'],
  Renault: ['NMC R135 52 kWh', 'NMC Z.E.50 41 kWh'],
};

interface FormData {
  oem: string;
  model: string;
  year: string;
  batteryModel: string;
  region: string;
  usageType: UsageType | '';
  chargeType: ChargeType | '';
  soh: string;
  mileage: string;
  measurementMethod: MeasurementMethod | '';
  date: string;
  notes: string;
}

const INITIAL: FormData = {
  oem: '', model: '', year: '', batteryModel: '',
  region: '', usageType: '', chargeType: '',
  soh: '', mileage: '', measurementMethod: '', date: '', notes: '',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-on-surface mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const INPUT = "w-full px-4 py-3 rounded-xl bg-surface-container-lowest ghost-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20";
const SELECT = INPUT + " cursor-pointer";

export default function Register() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [regressionResult, setRegressionResult] = useState<ReturnType<typeof checkRegression> | null>(null);
  const [resultStatus, setResultStatus] = useState<'approved' | 'pending_moderation'>('approved');

  function set(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function canAdvance() {
    if (step === 0) return form.oem && form.model && form.year && form.batteryModel;
    if (step === 1) return form.region && form.usageType && form.chargeType;
    if (step === 2) return form.soh && form.mileage && form.measurementMethod && form.date;
    return true;
  }

  function handleNext() {
    if (step < 3) setStep(step + 1);
    if (step === 2) {
      // Run regression check when moving to confirmation
      const result = checkRegression(
        {
          oem: form.oem,
          model: form.model,
          year: parseInt(form.year),
          soh: parseFloat(form.soh),
          mileage: parseInt(form.mileage),
        },
        MOCK_ENTRIES
      );
      setRegressionResult(result);
      setResultStatus(result.isOutlier ? 'pending_moderation' : 'approved');
    }
  }

  function handleSubmit() {
    // In a real app: POST to API. Here just transitions to success screen.
    setSubmitted(true);
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-panel ghost-border rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center mx-auto mb-5">
            <Activity className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-headline font-bold mb-2">Accesso richiesto</h1>
          <p className="text-secondary text-sm mb-6">Per aggiungere una misurazione devi essere autenticato.</p>
          <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary/90 transition-colors">
            Accedi <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="mt-3">
            <Link to="/signup" className="text-sm text-secondary hover:text-primary transition-colors">
              Oppure registrati gratuitamente
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-panel ghost-border rounded-2xl p-8 text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 ${resultStatus === 'approved' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
            <CheckCircle className={`w-7 h-7 ${resultStatus === 'approved' ? 'text-emerald-600' : 'text-amber-600'}`} />
          </div>
          <h1 className="text-2xl font-headline font-bold mb-2">
            {resultStatus === 'approved' ? 'Misurazione inviata!' : 'In attesa di revisione'}
          </h1>
          <p className="text-secondary text-sm mb-6">
            {resultStatus === 'approved'
              ? 'La tua misurazione è stata approvata automaticamente e apparirà nel database.'
              : 'Il valore rilevato si discosta significativamente dalla regressione per questo modello. Un moderatore la verificherà a breve.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/" className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors">
              Torna all'Esplora
            </Link>
            <button onClick={() => { setForm(INITIAL); setStep(0); setSubmitted(false); }}
              className="px-5 py-2.5 ghost-border bg-surface-container rounded-xl font-semibold text-sm hover:bg-surface-container-high transition-colors">
              Aggiungi un'altra
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="flex justify-center mb-8">
          <Link to="/" className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-on-primary shadow-xl shadow-primary/20 text-xl">⚡</Link>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done = i < step;
            return (
              <React.Fragment key={s.label}>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${active ? 'bg-primary text-on-primary' :
                    done ? 'bg-primary-container text-on-primary-container' :
                      'bg-surface-container text-secondary'
                  }`}>
                  <Icon className="w-3.5 h-3.5" />
                  {s.label}
                </div>
                {i < STEPS.length - 1 && <div className={`h-0.5 w-6 rounded ${done ? 'bg-primary' : 'bg-outline-variant/30'}`} />}
              </React.Fragment>
            );
          })}
        </div>

        <div className="glass-panel ghost-border rounded-2xl p-8">

          {/* Step 0 – Vehicle */}
          {step === 0 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="mb-6">
                <h2 className="text-xl font-headline font-bold mb-1">Dati del veicolo</h2>
                <p className="text-secondary text-sm">Seleziona il costruttore, il modello e i dati batteria.</p>
              </div>
              <Field label="Costruttore (OEM)">
                <select value={form.oem} onChange={(e) => set('oem', e.target.value)} className={SELECT}>
                  <option value="">Seleziona OEM</option>
                  {OEMS.map((o) => <option key={o}>{o}</option>)}
                  <option value="Altro">Altro</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Modello">
                  <input value={form.model} onChange={(e) => set('model', e.target.value)} placeholder="es. Model Y" className={INPUT} />
                </Field>
                <Field label="Anno">
                  <input type="number" min="2010" max="2026" value={form.year} onChange={(e) => set('year', e.target.value)} placeholder="es. 2022" className={INPUT} />
                </Field>
              </div>
              <Field label="Modello batteria">
                <input value={form.batteryModel} onChange={(e) => set('batteryModel', e.target.value)} placeholder="es. LFP 57.5 kWh" className={INPUT} list="battery-list" />
                <datalist id="battery-list">
                  {(BATTERY_SUGGESTIONS[form.oem] ?? []).map((b) => <option key={b} value={b} />)}
                </datalist>
              </Field>
            </div>
          )}

          {/* Step 1 – Usage */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="mb-6">
                <h2 className="text-xl font-headline font-bold mb-1">Dati di utilizzo</h2>
                <p className="text-secondary text-sm">Indica dove e come viene utilizzato il veicolo.</p>
              </div>
              <Field label="Regione d'uso prevalente">
                <select value={form.region} onChange={(e) => set('region', e.target.value)} className={SELECT}>
                  <option value="">Seleziona regione</option>
                  {REGIONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Tipo di utilizzo prevalente">
                <div className="grid grid-cols-2 gap-2">
                  {USAGE_TYPES.map((t) => (
                    <button key={t} type="button" onClick={() => set('usageType', t)}
                      className={`px-4 py-3 rounded-xl text-sm font-medium border transition-colors ${form.usageType === t ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-lowest ghost-border hover:bg-surface-container'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Tipo di ricarica prevalente">
                <div className="space-y-2">
                  {CHARGE_TYPES.map((t) => (
                    <button key={t} type="button" onClick={() => set('chargeType', t)}
                      className={`w-full px-4 py-3 rounded-xl text-sm font-medium border text-left transition-colors ${form.chargeType === t ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-lowest ghost-border hover:bg-surface-container'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* Step 2 – SOH */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="mb-6">
                <h2 className="text-xl font-headline font-bold mb-1">Misurazione SOH</h2>
                <p className="text-secondary text-sm">Inserisci i dati della misurazione State of Health.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="SOH (%)">
                  <input type="number" min="0" max="100" step="0.1" value={form.soh} onChange={(e) => set('soh', e.target.value)} placeholder="es. 94.5" className={INPUT} />
                </Field>
                <Field label="Chilometraggio (km)">
                  <input type="number" min="0" value={form.mileage} onChange={(e) => set('mileage', e.target.value)} placeholder="es. 35000" className={INPUT} />
                </Field>
              </div>
              <Field label="Metodo di misurazione">
                <select value={form.measurementMethod} onChange={(e) => set('measurementMethod', e.target.value as MeasurementMethod)} className={SELECT}>
                  <option value="">Seleziona metodo</option>
                  {MEASUREMENT_METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Data di rilevazione">
                <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} max={new Date().toISOString().split('T')[0]} className={INPUT} />
              </Field>
              <Field label="Note aggiuntive (opzionale)">
                <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} placeholder="Es. rilevato dopo piena ricarica notturna..." className={INPUT + ' resize-none'} />
              </Field>
            </div>
          )}

          {/* Step 3 – Confirm */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="mb-6">
                <h2 className="text-xl font-headline font-bold mb-1">Conferma e invia</h2>
                <p className="text-secondary text-sm">Verifica i dati prima dell'invio.</p>
              </div>

              {regressionResult?.isOutlier && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="font-semibold text-amber-800 text-sm mb-1">⚠️ Dato anomalo rilevato</div>
                  <p className="text-xs text-amber-700">
                    Il valore SOH inserito ({form.soh}%) si discosta di {Math.abs(regressionResult.deviation).toFixed(1)}% dal valore previsto dalla regressione ({regressionResult.predicted.toFixed(1)}%) per questo modello.
                    La misurazione sarà inviata ai moderatori per verifica.
                  </p>
                </div>
              )}
              {regressionResult && !regressionResult.isOutlier && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="font-semibold text-emerald-800 text-sm">✅ Dato coerente con la regressione</div>
                  <p className="text-xs text-emerald-700 mt-1">Il valore verrà approvato automaticamente.</p>
                </div>
              )}

              <div className="rounded-xl bg-surface-container divide-y divide-outline-variant/20 overflow-hidden text-sm">
                {[
                  ['Veicolo', `${form.oem} ${form.model} (${form.year})`],
                  ['Batteria', form.batteryModel],
                  ['Regione', form.region],
                  ['Utilizzo', form.usageType],
                  ['Ricarica', form.chargeType],
                  ['SOH', `${form.soh}%`],
                  ['Chilometraggio', `${parseInt(form.mileage).toLocaleString('it-IT')} km`],
                  ['Metodo', form.measurementMethod],
                  ['Data', form.date],
                  ...(form.notes ? [['Note', form.notes]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between px-4 py-2.5">
                    <span className="text-secondary">{k}</span>
                    <span className="font-medium text-right max-w-[60%]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-between">
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 px-5 py-2.5 ghost-border bg-surface-container rounded-xl text-sm font-medium hover:bg-surface-container-high transition-colors">
                <ArrowLeft className="w-4 h-4" /> Indietro
              </button>
            ) : (
              <Link to="/" className="flex items-center gap-2 px-5 py-2.5 ghost-border bg-surface-container rounded-xl text-sm font-medium hover:bg-surface-container-high transition-colors">
                <ArrowLeft className="w-4 h-4" /> Annulla
              </Link>
            )}
            {step < 3 ? (
              <button
                onClick={handleNext}
                disabled={!canAdvance()}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
              >
                Avanti <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Invia <Zap className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
