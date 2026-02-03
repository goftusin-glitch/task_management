import api from './axios';
import type { AuthToken, User } from '../types';

export const login = async (email: string, password: string): Promise<AuthToken> => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await api.post('/api/auth/login', formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    return response.data;
};

export const getCurrentUser = async (): Promise<User> => {
    const response = await api.get('/api/auth/me');
    return response.data;
};
