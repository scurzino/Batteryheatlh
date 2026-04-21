import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, MOCK_USERS } from '../data/mockData';

interface AuthContextType {
    currentUser: User | null;
    login: (email: string, password: string) => { success: boolean; error?: string };
    logout: () => void;
    signup: (name: string, email: string, password: string) => { success: boolean; error?: string };
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'ev_soh_user_id';

// Mutable registry so newly signed-up users persist in session
const userRegistry: User[] = [...MOCK_USERS];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return userRegistry.find((u) => u.id === saved) ?? null;
        }
        return null;
    });

    const isAdmin = currentUser?.isAdmin ?? false;

    function login(email: string, password: string) {
        const user = userRegistry.find(
            (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (!user) return { success: false, error: 'Email o password non corretti.' };
        setCurrentUser(user);
        localStorage.setItem(STORAGE_KEY, user.id);
        return { success: true };
    }

    function logout() {
        setCurrentUser(null);
        localStorage.removeItem(STORAGE_KEY);
    }

    function signup(name: string, email: string, password: string) {
        if (userRegistry.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
            return { success: false, error: 'Email già registrata.' };
        }
        const initials = name
            .split(' ')
            .map((w) => w[0]?.toUpperCase() ?? '')
            .slice(0, 2)
            .join('');
        const newUser: User = {
            id: `u_${Date.now()}`,
            name,
            email,
            password,
            isAdmin: false,
            avatarInitials: initials,
            joinedAt: new Date().toISOString().split('T')[0],
        };
        userRegistry.push(newUser);
        setCurrentUser(newUser);
        localStorage.setItem(STORAGE_KEY, newUser.id);
        return { success: true };
    }

    return (
        <AuthContext.Provider value={{ currentUser, login, logout, signup, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
