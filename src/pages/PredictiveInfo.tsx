import React from 'react';
import { ArrowLeft, BrainCircuit } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PredictiveInfo() {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 animate-in fade-in duration-500">
      <Link to="/predictive-model" className="flex items-center gap-2 text-sm text-secondary hover:text-on-surface font-medium transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Model
      </Link>
      
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
        <BrainCircuit className="w-8 h-8 text-primary" />
      </div>
      
      <h1 className="text-4xl md:text-5xl font-headline font-black mb-6 text-on-surface">
        Predictive SOH Modeling <span className="text-primary font-medium">In Development</span>
      </h1>
      
      <div className="space-y-6 text-secondary leading-relaxed">
        <p className="text-lg text-on-surface font-medium">
          We are currently building a state-of-the-art predictive model using PyTorch to forecast the State of Health of EV batteries.
        </p>
        
        <div className="glass-panel ghost-border rounded-2xl p-8 mt-8">
          <h2 className="text-xl font-headline font-bold text-on-surface mb-4">What we are doing</h2>
          <p className="mb-4">
            Our goal is to accurately estimate battery degradation without relying solely on the vehicle's BMS (Battery Management System). We are training Long Short-Term Memory (LSTM) neural networks using real-world telemetry data such as cell voltages, currents, and temperatures.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>Ingesting multi-modal sensor data from various EV platforms.</li>
            <li>Training temporal models to understand degradation patterns.</li>
            <li>Creating an automated pipeline for user-provided CSV analysis.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
