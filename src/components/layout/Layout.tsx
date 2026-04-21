import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, Zap, Settings, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

export default function Layout() {
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() { logout(); navigate('/'); setMenuOpen(false); }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="sticky top-0 z-50 glass-panel ghost-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-headline font-bold text-primary flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-on-primary">⚡</div>
            EV-SOH
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-secondary">
            <Link to="/" className="hover:text-on-surface transition-colors">Esplora</Link>
            <Link to="/explorer" className="hover:text-on-surface transition-colors">Data Explorer</Link>
            <Link to="/benchmarks" className="hover:text-on-surface transition-colors">Benchmarks</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              placeholder="Cerca modello…"
              className="pl-9 pr-4 py-2 rounded-full ghost-border bg-surface-container-lowest text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-52"
            />
          </div>

          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm hover:bg-primary/90 transition-colors"
              >
                {currentUser.avatarInitials}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-11 w-52 glass-panel ghost-border rounded-2xl py-2 shadow-xl z-50">
                  <div className="px-4 py-2 border-b ghost-border">
                    <div className="font-semibold text-sm">{currentUser.name}</div>
                    <div className="text-xs text-secondary">{currentUser.email}</div>
                  </div>
                  <Link to="/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface-container transition-colors">
                    <Settings className="w-4 h-4 text-secondary" /> Impostazioni
                  </Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface-container transition-colors">
                    <Zap className="w-4 h-4 text-primary" /> Aggiungi misurazione
                  </Link>
                  {isAdmin && (
                    <Link to="/moderation" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-surface-container transition-colors">
                      <Shield className="w-4 h-4 text-primary" /> Moderazione
                    </Link>
                  )}
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" /> Disconnetti
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-4 py-2 rounded-full ghost-border bg-surface-container-lowest text-sm font-medium hover:bg-surface-container transition-colors">
                Accedi
              </Link>
              <Link to="/register" className="px-4 py-2 bg-primary text-on-primary rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Aggiungi
              </Link>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
