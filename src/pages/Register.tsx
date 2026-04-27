import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, CheckCircle, Car, MapPin, Zap, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import { OEMS, COUNTRIES, USAGE_TYPES, CHARGE_TYPES, MEASUREMENT_METHODS, UsageType, ChargeType, MeasurementMethod } from '../data/mockData';

const STEPS = [
  { label: 'Vehicle', icon: Car },
  { label: 'Usage', icon: MapPin },
  { label: 'SOH', icon: Activity },
  { label: 'Confirm', icon: CheckCircle },
];

const BATTERY_SUGGESTIONS: Record<string, string[]> = {
  Tesla: ['LFP 57.5 kWh', 'LFP 60 kWh', 'NCA 75 kWh', 'NCA 100 kWh'],
  Volkswagen: ['NCM 58 kWh', 'NCM 77 kWh', 'LFP 77 kWh'],
  Hyundai: ['NCM 72.6 kWh', 'NCM 58 kWh'],
  Polestar: ['NMC 78 kWh', 'NMC 82 kWh'],
  BMW: ['NCM 80 kWh', 'NCM 66 kWh'],
  Renault: ['NMC R135 52 kWh', 'NMC Z.E.50 41 kWh'],
};

interface FormData {
  oem: string; model: string; year: string; batteryModel: string;
  grossCapacity: string; netCapacity: string;
  region: string; usageType: UsageType | ''; chargeType: ChargeType | '';
  minEnvTemp: string; maxEnvTemp: string; measurementTemp: string;
  soh: string; mileage: string; measurementMethod: MeasurementMethod | '';
  date: string; notes: string;
}

const INITIAL: FormData = {
  oem: '', model: '', year: '', batteryModel: '',
  grossCapacity: '', netCapacity: '',
  region: '', usageType: '', chargeType: '',
  minEnvTemp: '', maxEnvTemp: '', measurementTemp: '',
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [resultStatus, setResultStatus] = useState<string>('APPROVED');

  function set(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function canAdvance() {
    if (step === 0) return form.oem && form.model && form.year && form.batteryModel;
    if (step === 1) return form.region && form.usageType && form.chargeType && form.minEnvTemp && form.maxEnvTemp;
    if (step === 2) return form.soh && form.mileage && form.measurementMethod && form.date;
    return true;
  }

  function handleNext() {
    if (step < 3) setStep(step + 1);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const dbEntry = {
        oem: form.oem,
        model: form.model,
        year: parseInt(form.year),
        batteryModel: form.batteryModel,
        grossCapacity: form.grossCapacity ? parseFloat(form.grossCapacity) : undefined,
        netCapacity: form.netCapacity ? parseFloat(form.netCapacity) : undefined,
        region: form.region,
        usageType: form.usageType,
        chargeType: form.chargeType,
        minEnvTemp: form.minEnvTemp ? parseFloat(form.minEnvTemp) : undefined,
        maxEnvTemp: form.maxEnvTemp ? parseFloat(form.maxEnvTemp) : undefined,
        soh: parseFloat(form.soh),
        mileage: parseInt(form.mileage),
        measurementMethod: form.measurementMethod,
        measurementTemp: form.measurementTemp ? parseFloat(form.measurementTemp) : undefined,
        date: form.date,
        notes: form.notes
      };

      const res = await apiFetch('/soh/entry', {
        method: 'POST',
        body: JSON.stringify(dbEntry),
      });

      setResultStatus(res.entry.status);
      setSubmitted(true);
    } catch (err) {
      alert('Error submitting data');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-panel ghost-border rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center mx-auto mb-5">
            <Activity className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-headline font-bold mb-2">Login Required</h1>
          <p className="text-secondary text-sm mb-6">You must be logged in to add a measurement.</p>
          <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary/90 transition-colors">
            Log In <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-panel ghost-border rounded-2xl p-8 text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 ${resultStatus === 'APPROVED' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
            <CheckCircle className={`w-7 h-7 ${resultStatus === 'APPROVED' ? 'text-emerald-600' : 'text-amber-600'}`} />
          </div>
          <h1 className="text-2xl font-headline font-bold mb-2">
            {resultStatus === 'APPROVED' ? 'Measurement Submitted!' : 'Under Review (Anomaly Detected)'}
          </h1>
          <p className="text-secondary text-sm mb-6">
            {resultStatus === 'APPROVED'
              ? 'Your measurement has been validated by the backend and will appear in the database.'
              : 'The reported value deviates significantly from the backend exponential model. Submitted for moderation.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/" className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-sm">
              Back to Explore
            </Link>
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

        <div className="glass-panel ghost-border rounded-2xl p-8">
          {step === 0 && (
            <div className="space-y-5">
              <div className="mb-6"><h2 className="text-xl font-bold">Vehicle Data</h2></div>
              <Field label="Manufacturer (OEM)">
                <select value={form.oem} onChange={(e) => set('oem', e.target.value)} className={SELECT}>
                  <option value="">Select...</option>{OEMS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Model"><input value={form.model} onChange={(e) => set('model', e.target.value)} className={INPUT} /></Field>
                <Field label="Year"><input type="number" value={form.year} onChange={(e) => set('year', e.target.value)} className={INPUT} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Battery Model"><input value={form.batteryModel} onChange={(e) => set('batteryModel', e.target.value)} className={INPUT} placeholder="e.g. LFP 60kWh" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Gross Capacity (kWh) - Optional"><input type="number" step="0.1" value={form.grossCapacity} onChange={(e) => set('grossCapacity', e.target.value)} className={INPUT} placeholder="77.4" /></Field>
                <Field label="Net Capacity (kWh) - Optional"><input type="number" step="0.1" value={form.netCapacity} onChange={(e) => set('netCapacity', e.target.value)} className={INPUT} placeholder="74.0" /></Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="mb-6"><h2 className="text-xl font-bold">Environmental Usage</h2></div>
              <Field label="Primary Usage Country">
                <select value={form.region} onChange={(e) => set('region', e.target.value)} className={SELECT}>
                  <option value="">Select Country...</option>{COUNTRIES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Avg. Min Temp (°C)"><input type="number" value={form.minEnvTemp} onChange={(e) => set('minEnvTemp', e.target.value)} className={INPUT} placeholder="-5" /></Field>
                <Field label="Avg. Max Temp (°C)"><input type="number" value={form.maxEnvTemp} onChange={(e) => set('maxEnvTemp', e.target.value)} className={INPUT} placeholder="35" /></Field>
              </div>
              <Field label="Usage Type"><select value={form.usageType} onChange={(e) => set('usageType', e.target.value as any)} className={SELECT}><option value="">Select...</option>{USAGE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
              <Field label="Charging"><select value={form.chargeType} onChange={(e) => set('chargeType', e.target.value as any)} className={SELECT}><option value="">Select...</option>{CHARGE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="mb-6"><h2 className="text-xl font-bold">Measurement</h2></div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="SOH (%)"><input type="number" step="0.1" value={form.soh} onChange={(e) => set('soh', e.target.value)} className={INPUT} /></Field>
                <Field label="Measurement Temp (°C) - Optional"><input type="number" step="0.1" value={form.measurementTemp} onChange={(e) => set('measurementTemp', e.target.value)} className={INPUT} placeholder="20" /></Field>
              </div>
              <Field label="Mileage (km)"><input type="number" value={form.mileage} onChange={(e) => set('mileage', e.target.value)} className={INPUT} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Date"><input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className={INPUT} /></Field>
                <Field label="Method"><select value={form.measurementMethod} onChange={(e) => set('measurementMethod', e.target.value as any)} className={SELECT}><option value="">Select...</option>{MEASUREMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</select></Field>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="mb-6"><h2 className="text-xl font-bold">Confirm Submission</h2></div>
              <p className="text-sm pb-4">By clicking Submit, your data will be processed through our mathematical validator running on the backend (Backend API).</p>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            {step > 0 ? <button onClick={() => setStep(step - 1)} className="px-5 py-2.5 ghost-border rounded-xl">Back</button> : <div />}
            {step < 3 ? (
              <button disabled={!canAdvance()} onClick={handleNext} className="px-5 py-2.5 bg-primary text-white rounded-xl">Next</button>
            ) : (
              <button disabled={isSubmitting} onClick={handleSubmit} className="px-5 py-2.5 bg-primary text-white rounded-xl">{isSubmitting ? 'Submitting...' : 'Submit to Server'}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
