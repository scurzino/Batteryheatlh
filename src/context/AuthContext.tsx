import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabase';

export interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
}

interface AuthContextType {
    currentUser: User | null;
    isLoading: boolean;
    isAdmin: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractErrorMessage(error: unknown): string {
    if (!error) return 'Unknown error';
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && error !== null) {
        const e = error as Record<string, unknown>;
        if (typeof e.message === 'string') return e.message;
        if (typeof e.msg === 'string') return e.msg;
        if (typeof e.error_description === 'string') return e.error_description;
    }
    return 'An unexpected error occurred';
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setCurrentUser({
                    id: session.user.id,
                    email: session.user.email!,
                    name: session.user.user_metadata?.name || null,
                    role: 'USER', // Ruolo di default, espandibile con i metadati di Supabase
                });
            }
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setCurrentUser({
                    id: session.user.id,
                    email: session.user.email!,
                    name: session.user.user_metadata?.name || null,
                    role: 'USER', 
                });
            } else {
                setCurrentUser(null);
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const isAdmin = currentUser?.role === 'ADMIN';

    async function login(email: string, password: string) {
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { success: false, error: extractErrorMessage(error) };
            return { success: true };
        } catch (err) {
            return { success: false, error: extractErrorMessage(err) };
        }
    }

    async function signup(name: string, email: string, password: string) {
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { name } }
            });
            if (error) return { success: false, error: extractErrorMessage(error) };
            return { success: true };
        } catch (err) {
            return { success: false, error: extractErrorMessage(err) };
        }
    }

    async function logout() {
        await supabase.auth.signOut();
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
