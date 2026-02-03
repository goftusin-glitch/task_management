import api from './axios';
import type { User, UserCreate, UserUpdate } from '../types';

export const getUsers = async (): Promise<User[]> => {
    const response = await api.get('/api/users/');
    return response.data;
};

export const getUser = async (id: number): Promise<User> => {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
};

export const createUser = async (data: UserCreate): Promise<User> => {
    const response = await api.post('/api/users/', data);
    return response.data;
};

export const updateUser = async (id: number, data: UserUpdate): Promise<User> => {
    const response = await api.put(`/api/users/${id}`, data);
    return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
    await api.delete(`/api/users/${id}`);
};

export const getNonAdminUsers = async (): Promise<User[]> => {
    const response = await api.get('/api/users/non-admin/list');
    return response.data;
};
