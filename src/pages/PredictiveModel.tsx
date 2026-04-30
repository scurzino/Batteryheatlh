import React, { useState, useEffect } from 'react';
import { BrainCircuit, Download, Upload, Cpu, ArrowRight, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { Link } from 'react-router-dom';

export default function PredictiveModel() {
  const [file, setFile] = useState<File | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/soh/my-entries')
      .then(data => {
        const uniqueVehicles: any[] = [];
        const seen = new Set();
        for (const e of data) {
          if (!seen.has(e.vehicle.id)) {
            uniqueVehicles.push(e.vehicle);
            seen.add(e.vehicle.id);
          }
        }
        setVehicles(uniqueVehicles);
        if (uniqueVehicles.length > 0) {
          setSelectedVehicleId(uniqueVehicles[0].id);
        }
      })
      .catch(err => {
        console.error('Failed to fetch user vehicles', err);
      });
  }, []);
  const handleDownloadCsv = () => {
    // Genera un CSV template vuoto con le 8 colonne esatte richieste dal modello PyTorch
    const headers = ['avg_cell_voltage', 'charging_current', 'max_cell_voltage', 'min_cell_voltage', 'max_cell_temp', 'min_cell_temp', 'soc', 'timestamp'];
    const dummyData1 = [3.8, 15.0, 3.85, 3.75, 25.0, 24.0, 80, 1715000000];
    const dummyData2 = [3.82, 14.8, 3.86, 3.76, 25.2, 24.1, 81, 1715000060];
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + dummyData1.join(",") + "\n"
      + dummyData2.join(",") + "\n";
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_ricarica_evsoh.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Pre-Validazione Lato Client: controllo delle intestazioni
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          const firstLine = text.split('\n')[0].trim();
          const requiredHeaders = 'avg_cell_voltage,charging_current,max_cell_voltage,min_cell_voltage,max_cell_temp,min_cell_temp,soc,timestamp';
          
          if (firstLine !== requiredHeaders) {
            setError('Formato file non valido. Assicurati di usare il template corretto e che le 8 colonne siano presenti nel giusto ordine.');
            setFile(null);
          } else {
            setError(null);
            setFile(selectedFile);
          }
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleInference = async () => {
    if (!file || !selectedVehicleId) return;
    
    setIsUploading(true);
    setError(null);
    setPredictionResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('vehicleId', selectedVehicleId);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/predict-soh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Errore durante la predizione');
      }

      const result = await res.json();
      setPredictionResult(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-headline font-bold mb-2 flex items-center gap-3">
          <BrainCircuit className="w-8 h-8 text-primary" /> SOH Predictive Model
        </h1>
        <p className="text-secondary text-sm">
          Use our AI model trained on neural networks (PyTorch) to get an accurate estimation of the State of Health.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Step 1: Download */}
        <div className="glass-panel ghost-border rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
          <div className="w-12 h-12 rounded-xl bg-primary-container text-primary flex items-center justify-center mb-6">
            <Download className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-headline mb-2">1. Download Template</h2>
          <p className="text-secondary text-sm mb-8">
            To get a prediction, you need to format your vehicle's data into a format recognized by the model.
          </p>
          <button 
            onClick={handleDownloadCsv}
            className="flex items-center gap-2 px-5 py-2.5 bg-surface text-on-surface border ghost-border rounded-xl font-medium hover:bg-surface-container transition-colors"
          >
            <Download className="w-4 h-4" /> Template CSV
          </button>
        </div>

        {/* Step 2: Upload */}
        <div className="glass-panel ghost-border rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -z-10" />
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
            <Upload className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-headline mb-2">2. Upload Data</h2>
          <p className="text-secondary text-sm mb-8">
            Upload the populated CSV file. The backend will process it through the `.pt` model to return your prediction.
          </p>
          
          {vehicles.length === 0 ? (
            <div className="p-4 bg-orange-50 text-orange-800 rounded-xl flex items-start gap-3 border border-orange-200">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">No vehicles found</p>
                <p className="text-xs mt-1">
                  You need to register at least one vehicle measurement before using the predictive model.
                  Please add a vehicle in your <Link to="/settings" className="underline font-semibold">Settings</Link> or by adding an entry in <Link to="/explore" className="underline font-semibold">Explore</Link>.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-semibold text-secondary mb-1">Select Vehicle</label>
                <select 
                  value={selectedVehicleId} 
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border ghost-border bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.oem} {v.model} ({v.year}) - {v.batteryModel}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-outline-variant rounded-xl cursor-pointer hover:bg-surface-container-lowest transition-colors">
                <span className="text-sm font-medium text-secondary text-center">
                  {file ? file.name : "Click to select a CSV file"}
                </span>
                <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              </label>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
                  {error}
                </div>
              )}

              <button 
                onClick={handleInference}
                disabled={!file || !selectedVehicleId || isUploading}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-primary text-on-primary rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                ) : (
                  <><Cpu className="w-4 h-4" /> Start Inference <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="glass-panel ghost-border rounded-3xl p-8 mt-8">
        <h2 className="text-xl font-bold font-headline mb-4">Prediction Results</h2>
        {predictionResult ? (
          <div className="p-8 text-center bg-primary-container/20 rounded-xl border border-primary/20 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <BrainCircuit className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-sm font-medium text-secondary mb-1">Predicted State of Health (SOH)</h3>
            <div className="text-5xl font-bold font-headline text-primary">
              {predictionResult.predicted_soh?.toFixed(1) || '--'}%
            </div>
            <p className="text-sm text-secondary mt-4 max-w-md">
              This prediction was generated by passing your driving data through the LSTM neural network model.
            </p>
          </div>
        ) : (
          <div className="p-8 text-center text-secondary bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant">
            Upload a file and start the inference to view the prediction generated by the PyTorch model.
          </div>
        )}
      </div>
    </div>
  );
}
