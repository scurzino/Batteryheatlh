import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SignUp() {
    const { signup, currentUser } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (currentUser) {
        navigate('/', { replace: true });
        return null;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        if (password !== repeatPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        const result = await signup(name, email, password);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.error ?? 'Unknown error');
            setLoading(false);
        }
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
                    <h1 className="text-2xl font-headline font-bold text-center mb-1">Create Account</h1>
                    <p className="text-center text-secondary text-sm mb-8">Join the EV-SOH community</p>

                    {error && (
                        <div className="mb-4 px-4 py-3 bg-error-container text-on-error-container rounded-xl text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1" htmlFor="name">Full Name</label>
                            <input
                                id="name" type="text" required
                                value={name} onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest ghost-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1" htmlFor="email">Email</label>
                            <input
                                id="email" type="email" required autoComplete="email"
                                value={email} onChange={(e) => setEmail(e.target.value)}
                                placeholder="john@example.com"
                                className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest ghost-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1" htmlFor="password">Password</label>
                            <div className="relative">
                                <input
                                    id="password" type={showPassword ? "text" : "password"} required
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                    placeholder="At least 6 characters"
                                    className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest ghost-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 pr-10"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-secondary hover:text-primary transition-colors">
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-on-surface mb-1" htmlFor="repeatPassword">Repeat Password</label>
                            <div className="relative">
                                <input
                                    id="repeatPassword" type={showPassword ? "text" : "password"} required
                                    value={repeatPassword} onChange={(e) => setRepeatPassword(e.target.value)}
                                    placeholder="Repeat your password"
                                    className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest ghost-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 w-full flex items-center justify-center gap-2 py-3 bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                        >
                            {loading ? 'Signing up…' : <>Create Account <ArrowRight className="w-4 h-4" /></>}
                        </button>
                    </form>

                    <div className="mt-6 pt-5 border-t ghost-border text-center text-sm text-secondary">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary font-semibold hover:underline">Log In</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
