import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, User, Car, Activity, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, SohBadge } from '../components/ui/Badge';
import { apiFetch } from '../utils/api';

export default function Settings() {
  const { currentUser, logout, isAdmin } = useAuth();
  const [myEntries, setMyEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      apiFetch('/soh/my-entries')
        .then(data => {
          const shaped = data.map((e: any) => ({
            id: e.id,
            vehicleId: e.vehicle.id,
            oem: e.vehicle.oem,
            model: e.vehicle.model,
            year: e.vehicle.year,
            mileage: e.mileage,
            region: e.region,
            date: e.date,
            soh: e.soh,
            status: e.status,
            needsUpdate: !e.vehicle.grossCapacity || !e.vehicle.netCapacity || e.vehicle.minEnvTemp === null || e.vehicle.maxEnvTemp === null || e.measurementTemp === null
          }));
          setMyEntries(shaped);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center min-h-[60vh]">
        <User className="w-10 h-10 text-secondary mb-4" />
        <h1 className="text-2xl font-headline font-bold mb-2">Login Required</h1>
        <p className="text-secondary text-sm mb-5">Please log in to view your settings.</p>
        <Link to="/login" className="px-5 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-headline font-bold mb-1">Settings</h1>
        <p className="text-secondary text-sm">Manage your profile and measurements.</p>
      </div>

      {/* Profile */}
      <section className="glass-panel ghost-border rounded-2xl p-6">
        <h2 className="font-headline font-bold mb-5 flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Profile</h2>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center text-xl font-bold font-headline shrink-0">
            {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <div className="font-headline font-bold text-xl">{currentUser.name}</div>
            <div className="text-secondary text-sm">{currentUser.email}</div>
            {isAdmin && (
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-primary text-on-primary rounded-full text-[10px] font-bold uppercase tracking-wider">
                <Shield className="w-3 h-3" /> Admin
              </div>
            )}
          </div>
        </div>
      </section>

      {/* My entries */}
      <section className="glass-panel ghost-border rounded-2xl p-6">
        <h2 className="font-headline font-bold mb-5 flex items-center gap-2"><Activity className="w-5 h-5 text-primary" /> My Measurements</h2>
        {loading ? <p>Loading...</p> : myEntries.length === 0 ? (
          <div className="text-secondary text-sm text-center py-6">
            <p className="mb-3">You haven't added any measurements yet.</p>
            <Link to="/register" className="text-primary font-semibold hover:underline">Add your first measurement →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myEntries.map((e) => (
              <Link key={e.id} to={`/vehicle/${e.id}`} className="flex items-center justify-between p-4 rounded-xl ghost-border hover:bg-surface-container transition-colors group">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-sm">{e.oem} {e.model} ({e.year})</div>
                    {e.needsUpdate && (
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" title="New technical fields are available to improve the accuracy of this measurement."></div>
                    )}
                  </div>
                  <div className="text-xs text-secondary mt-0.5">{e.mileage.toLocaleString('en-US')} km · {e.region} · {new Date(e.date).toLocaleDateString('en-US')}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <SohBadge soh={e.soh} />
                  <StatusBadge status={e.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
        <div className="mt-4">
          <Link to="/register" className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
            + Add Measurement
          </Link>
        </div>
      </section>

      {/* Admin quick link */}
      {isAdmin && (
        <section className="glass-panel ghost-border rounded-2xl p-6">
          <h2 className="font-headline font-bold mb-3 flex items-center gap-2"><Shield className="w-5 h-5 text-primary" /> Admin Panel</h2>
          <Link to="/moderation" className="inline-flex items-center gap-2 px-4 py-2.5 ghost-border bg-surface-container rounded-xl text-sm font-medium hover:bg-surface-container-high transition-colors">
            Go to Moderation →
          </Link>
        </section>
      )}

      {/* Logout */}
      <section className="pt-2">
        <button
          onClick={logout}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Log Out
        </button>
      </section>
    </div>
  );
}
