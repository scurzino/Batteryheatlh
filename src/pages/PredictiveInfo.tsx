import React from 'react';
import { ArrowLeft, BrainCircuit, ExternalLink, Lightbulb, Activity, LineChart, Target, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PredictiveInfo() {
  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 animate-in fade-in duration-500">
      <Link to="/predictive-model" className="flex items-center gap-2 text-sm text-secondary hover:text-on-surface font-medium transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Model
      </Link>
      
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
          <BrainCircuit className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-headline font-black text-on-surface">
            EV Battery Health & Capacity Estimation
          </h1>
          <p className="text-primary font-semibold tracking-wide uppercase text-sm mt-1">From Research to Real-World Application</p>
        </div>
      </div>

      <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 mb-10 text-sm shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
        <div className="flex items-start gap-3">
          <ExternalLink className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
          <div className="text-secondary">
            <p className="font-semibold text-on-surface mb-1">Academic Reference</p>
            <p className="leading-relaxed">
              All the methodology and logic implemented in our predictive system is based on the following state-of-the-art research:
              <br/>
              <span className="italic text-on-surface block mt-2">
                "He, Haowei, J. Zhang, Yanan Wang, Benben Jiang, Shaobo Huang, Chen Wang, Yang Zhang, Xue Lei Han, Dongxu Guo, Guannan He and Minggao Ouyang. 'EVBattery: A Large-Scale Electric Vehicle Dataset for Battery Health and Capacity Estimation.' (2022)."
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-12 text-secondary leading-relaxed">
        
        {/* Step 1 */}
        <section className="glass-panel ghost-border rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-bl-full -z-10" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Lightbulb className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-headline font-bold text-on-surface">1. The Business & Real-World Challenge</h2>
          </div>
          <p className="text-base text-on-surface/90">
            The rapid adoption of Electric Vehicles (EVs) brings crucial challenges in battery safety and lifespan estimation. Traditionally, estimating battery health requires chemical and physical tests; however, these methods are destructive, rendering the battery unusable and causing significant economic losses.
          </p>
          <p className="mt-4">
            To solve this, we looked at the latest state-of-the-art academic research, which proposes a non-invasive, data-driven approach. By analyzing everyday charging data, it is possible to accurately estimate the remaining cruise range of a vehicle without taking it apart.
          </p>
        </section>

        {/* Step 2 */}
        <section className="glass-panel ghost-border rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full -z-10" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-headline font-bold text-on-surface">2. The Foundation – Leveraging Academic Research</h2>
          </div>
          <p className="mb-6">
            Rather than reinventing the wheel, our system is built upon a proven methodology detailed in a recent, highly regarded scientific paper. The researchers originally validated this pipeline on a massive real-world dataset comprising over 1.2 million charging snippets from 464 different EVs.
          </p>
          <p className="mb-6">
            The core logic we adopted is simple but powerful: we extract continuous charging data and segment it into sliding windows of exactly 128 time-points. For each point, we track 8 key physical variables—such as average cell voltage, current, temperatures, and State of Charge (SOC)—following the exact formatting prescribed by the study.
          </p>
          <div className="rounded-xl overflow-hidden border ghost-border shadow-md mt-6">
            <img src="/images/data_matrix_concept.png" alt="Data Matrix Concept" className="w-full h-auto object-cover" />
            <div className="bg-surface-container-low p-3 text-xs text-center border-t ghost-border">
              Figure 1. Continuous charging data segmented into 128x8 sliding windows.
            </div>
          </div>
        </section>

        {/* Step 2.5 */}
        <section className="glass-panel ghost-border rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-bl-full -z-10" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-headline font-bold text-on-surface">2.5 How the AI "Thinks" (The Logical Flow)</h2>
          </div>
          <p className="mb-6">
            To understand how the model we implemented estimates capacity, we can compare it to a doctor performing a stress ECG. The doctor doesn't look at a single isolated heartbeat; they observe how the heart responds and fatigues over time. The Artificial Intelligence architecture we adopted does exactly the same thing during the charging process.
          </p>
          
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-surface-container-lowest p-5 rounded-2xl border ghost-border">
              <h3 className="font-bold text-on-surface mb-2">1. Ingesting "Symptoms" (Raw Data)</h3>
              <p className="text-sm">During charging, the neural network receives the vital signs in real-time: Voltage (how hard we are pushing), Current (how much energy is entering), and Temperature (how hot it's getting).</p>
            </div>
            <div className="bg-surface-container-lowest p-5 rounded-2xl border ghost-border">
              <h3 className="font-bold text-on-surface mb-2">2. Observation over Time</h3>
              <p className="text-sm">The model "stretches" data into a perfect temporal sequence of 128 frames. This allows the LSTM network to have "memory" and compare the beginning of the charge with the end.</p>
            </div>
            <div className="bg-surface-container-lowest p-5 rounded-2xl border ghost-border">
              <h3 className="font-bold text-on-surface mb-2">3. The Secret Reasoning</h3>
              <p className="text-sm">The model learns to notice patterns invisible to the human eye, such as subtle voltage rises relative to the injected current, which indicate an increase in internal resistance.</p>
            </div>
            <div className="bg-surface-container-lowest p-5 rounded-2xl border ghost-border">
              <h3 className="font-bold text-on-surface mb-2">4. The Verdict (Compression)</h3>
              <p className="text-sm">All these temporal clues are compressed and filtered. The final result converges into a single, highly precise number: the residual Capacity in Ah.</p>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border ghost-border shadow-md">
            <img src="/images/ai_logic_flow.png" alt="AI Logic Flow" className="w-full h-auto object-cover" />
            <div className="bg-surface-container-low p-3 text-xs text-center border-t ghost-border">
              Figure 2. Logical flow of AI analyzing battery charging data.
            </div>
          </div>
        </section>

        {/* Step 3 */}
        <section className="glass-panel ghost-border rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-bl-full -z-10" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Target className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-headline font-bold text-on-surface">3. The Core Technology – Capacity Estimation</h2>
          </div>
          <p>
            The original academic paper explored two distinct branches using these 128x8 matrices: Health Anomaly Detection (using a DyAD algorithm) and Capacity Estimation. For our current platform, we made the strategic decision to focus exclusively on Capacity Estimation, leaving the anomaly detection branch out of our current scope.
          </p>
          <p className="mt-4">
            To estimate how much charge the battery can still hold (measured in Ah), we successfully implemented the LSTM (Long Short-Term Memory) neural network proposed by the researchers. This specific regression model has proven highly effective at reading charging curves and translating them into battery degradation metrics.
          </p>
        </section>

        {/* Step 4 */}
        <section className="glass-panel ghost-border rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-bl-full -z-10" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-headline font-bold text-on-surface">4. Proven Reliability – Our Replication Milestone</h2>
          </div>
          <p className="mb-6">
            The most important milestone of our current work is that we have successfully replicated the paper's Capacity Estimation results on our own cloud infrastructure. By carefully reconstructing the data formatting, handling the normalizers, and avoiding issues like "domain shifts" (which occur when raw data scales differ from training data distributions), we have proven that this academic pipeline is reliable and fully functional in an industrial environment.
          </p>
          <p className="mb-6 font-medium text-on-surface">
            We have effectively bridged the gap between a theoretical paper and a working, deployable API.
          </p>
          <div className="rounded-xl overflow-hidden border ghost-border shadow-md">
            <img src="/images/capacity_scatter_plot.png" alt="Capacity Scatter Plot" className="w-full h-auto object-cover" />
            <div className="bg-surface-container-low p-3 text-xs text-center border-t ghost-border">
              Figure 3. Demonstration of API predicted capacity aligning closely with actual capacity.
            </div>
          </div>
        </section>

        {/* Step 5 */}
        <section className="glass-panel ghost-border rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-bl-full -z-10" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
              <LineChart className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-headline font-bold text-on-surface">5. The Future – Scaling Up to the Mainstream Market</h2>
          </div>
          <p>
            Having successfully validated the research pipeline, our next strategic step is to scale up beyond the academic dataset. We are actively planning to acquire new, proprietary datasets focusing on a wider and more common pool of commercial vehicles.
          </p>
          <p className="mt-4">
            The research proves that using raw, unanonymized data yields the same high predictive power. By applying the pipeline we've built to broader vehicle fleets, we can leverage transfer learning to adapt these models to different manufacturers. This will unlock massive commercial value for fleet management, predictive maintenance, and the secondary battery market.
          </p>
        </section>
        
      </div>
    </div>
  );
}
