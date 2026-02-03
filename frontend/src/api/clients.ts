import api from './axios';
import type { Client, ClientCreate, ClientUpdate } from '../types';

export const getClients = async (): Promise<Client[]> => {
    const response = await api.get('/api/clients/');
    return response.data;
};

export const getClient = async (id: number): Promise<Client> => {
    const response = await api.get(`/api/clients/${id}`);
    return response.data;
};

export const createClient = async (data: ClientCreate): Promise<Client> => {
    const response = await api.post('/api/clients/', data);
    return response.data;
};

export const updateClient = async (id: number, data: ClientUpdate): Promise<Client> => {
    const response = await api.put(`/api/clients/${id}`, data);
    return response.data;
};

export const deleteClient = async (id: number): Promise<void> => {
    await api.delete(`/api/clients/${id}`);
};
