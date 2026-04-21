import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch } from '../utils/api';

// Sync this to the User model we now have in DB
export interface User {
    id: string;
    name: string | null;
    email: string;
    role: string;
}

interface AuthContextType {
    currentUser: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const TOKEN_KEY = 'token';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if token exists on mount and fetch profile
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            setIsLoading(false);
            return;
        }

        apiFetch('/auth/me')
            .then(user => {
                setCurrentUser(user);
            })
            .catch((err) => {
                console.error('Invalid token / session expired');
                localStorage.removeItem(TOKEN_KEY);
            })
            .finally(() => setIsLoading(false));
    }, []);

    const isAdmin = currentUser?.role === 'ADMIN';

    async function login(email: string, password: string) {
        try {
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            localStorage.setItem(TOKEN_KEY, data.token);
            setCurrentUser(data.user);
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    function logout() {
        setCurrentUser(null);
        localStorage.removeItem(TOKEN_KEY);
    }

    async function signup(name: string, email: string, password: string) {
        try {
            const data = await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, password })
            });
            localStorage.setItem(TOKEN_KEY, data.token);
            setCurrentUser(data.user);
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    }

    return (
        <AuthContext.Provider value={{ currentUser, isLoading, login, logout, signup, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
