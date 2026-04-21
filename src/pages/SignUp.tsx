import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SignUp() {
    const { signup, currentUser } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (currentUser) {
        navigate('/', { replace: true });
        return null;
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        if (password.length < 6) { setError('La password deve avere almeno 6 caratteri.'); return; }
        setLoading(true);
        setTimeout(() => {
            const result = signup(name, email, password);
            if (result.success) {
                navigate('/');
            } else {
                setError(result.error ?? 'Errore sconosciuto');
                setLoading(false);
            }
        }, 600);
    }

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <Link to="/" className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-on-primary shadow-xl shadow-primary/20 text-xl">
                        ⚡
                    </Link>
                </div>

                <div className="glass-panel ghost-border rounded-2xl p-8">
                    <h1 className="text-2xl font-headline font-bold text-center mb-1">Crea Account</h1>
                    <p className="text-center text-secondary text-sm mb-8">Unisciti alla community EV-SOH</p>

                    {error && (
                        <div className="mb-4 px-4 py-3 bg-error-container text-on-error-container rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1" htmlFor="name">Nome completo</label>
                            <input
                                id="name" type="text" required
                                value={name} onChange={(e) => setName(e.target.value)}
                                placeholder="Mario Rossi"
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest ghost-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1" htmlFor="email">Email</label>
                            <input
                                id="email" type="email" required autoComplete="email"
                                value={email} onChange={(e) => setEmail(e.target.value)}
                                placeholder="mario@example.it"
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest ghost-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1" htmlFor="password">Password</label>
                            <input
                                id="password" type="password" required
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                placeholder="Minimo 6 caratteri"
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest ghost-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 w-full flex items-center justify-center gap-2 py-3 bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                        >
                            {loading ? 'Registrazione…' : <>Crea Account <ArrowRight className="w-4 h-4" /></>}
                        </button>
                    </form>

                    <div className="mt-6 pt-5 border-t ghost-border text-center text-sm text-secondary">
                        Hai già un account?{' '}
                        <Link to="/login" className="text-primary font-semibold hover:underline">Accedi</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
