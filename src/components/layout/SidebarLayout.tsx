import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Car, FileBarChart, Settings as SettingsIcon, LayoutGrid, ChevronLeft, Shield, Zap, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SidebarLayout() {
  const location = useLocation();
  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Esplora', path: '/', icon: LayoutGrid },
    { name: 'Data Explorer', path: '/explorer', icon: Activity },
    { name: 'Benchmarks', path: '/benchmarks', icon: FileBarChart },
    { name: 'Impostazioni', path: '/settings', icon: SettingsIcon },
  ];

  function getInitials(name?: string) {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  function isActive(path: string) {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 glass-panel ghost-border px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-primary font-headline font-bold flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded text-xs flex items-center justify-center text-on-primary">⚡</div>
          EV-SOH
        </Link>
        <div className="flex items-center gap-2">
          {currentUser ? (
            <span className="text-xs font-semibold text-secondary">{currentUser.name}</span>
          ) : (
            <Link to="/login" className="text-xs font-medium text-primary">Accedi</Link>
          )}
        </div>
      </header>

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r ghost-border bg-surface-container-lowest h-screen sticky top-0 shrink-0">
        <div className="p-6">
          <Link to="/" className="text-2xl font-headline font-bold text-primary flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-on-primary">⚡</div>
            EV-SOH
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-primary-container text-on-primary-container' : 'text-secondary hover:bg-surface-container hover:text-on-surface'
                  }`}
              >
                <Icon className="w-5 h-5" /> {item.name}
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              to="/moderation"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive('/moderation') ? 'bg-primary-container text-on-primary-container' : 'text-secondary hover:bg-surface-container hover:text-on-surface'
                }`}
            >
              <Shield className="w-5 h-5" /> Moderazione
            </Link>
          )}

          <div className="pt-3 border-t ghost-border mt-3">
            <Link
              to="/register"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
            >
              <Zap className="w-5 h-5" /> Aggiungi misurazione
            </Link>
          </div>
        </nav>

        {/* User section */}
        <div className="p-4 border-t ghost-border">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <Link to="/settings" className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm shrink-0 hover:bg-primary/90 transition-colors">
                {getInitials(currentUser.name)}
              </Link>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{currentUser.name}</div>
                <div className="text-xs text-secondary truncate">{currentUser.email}</div>
              </div>
              <button onClick={() => { logout(); navigate('/'); }} className="p-1.5 text-secondary hover:text-red-600 transition-colors" title="Disconnetti">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-2 text-sm font-medium text-secondary hover:text-on-surface px-3 py-2 rounded-xl hover:bg-surface-container transition-colors">
              <User className="w-4 h-4" /> Accedi
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
