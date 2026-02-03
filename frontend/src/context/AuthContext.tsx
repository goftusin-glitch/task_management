import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthState } from '../types';
import { getCurrentUser } from '../api/auth';

interface AuthContextType extends AuthState {
    login: (token: string) => Promise<void>;
    logout: () => void;
    hasPageAccess: (page: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AuthState>({
        user: null,
        token: localStorage.getItem('token'),
        isAuthenticated: false,
        isAdmin: false,
        pageAccess: [],
        loading: true,
    });

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const user = await getCurrentUser();
                    setState({
                        user,
                        token,
                        isAuthenticated: true,
                        isAdmin: user.is_admin,
                        pageAccess: user.page_access || [],
                        loading: false,
                    });
                } catch {
                    localStorage.removeItem('token');
                    setState({
                        user: null,
                        token: null,
                        isAuthenticated: false,
                        isAdmin: false,
                        pageAccess: [],
                        loading: false,
                    });
                }
            } else {
                setState(prev => ({ ...prev, loading: false }));
            }
        };
        initAuth();
    }, []);

    const login = async (token: string) => {
        localStorage.setItem('token', token);
        const user = await getCurrentUser();
        setState({
            user,
            token,
            isAuthenticated: true,
            isAdmin: user.is_admin,
            pageAccess: user.page_access || [],
        });
    };

    const logout = () => {
        localStorage.removeItem('token');
        setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isAdmin: false,
            pageAccess: [],
        });
    };

    const hasPageAccess = (page: string): boolean => {
        if (state.isAdmin) return true;
        return state.pageAccess.includes(page);
    };

    return (
        <AuthContext.Provider value={{ ...state, login, logout, hasPageAccess }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
