import api from './axios';
import type { Task, TaskCreate, TaskUpdate } from '../types';

export const getAllTasks = async (): Promise<Task[]> => {
    const response = await api.get('/api/tasks/');
    return response.data;
};

export const getMyTasks = async (): Promise<Task[]> => {
    const response = await api.get('/api/tasks/my-tasks');
    return response.data;
};

export const getMyProgress = async (): Promise<Task[]> => {
    const response = await api.get('/api/tasks/my-progress');
    return response.data;
};

export const getCompletedTasks = async (): Promise<Task[]> => {
    const response = await api.get('/api/tasks/completed');
    return response.data;
};

export const getTask = async (id: number): Promise<Task> => {
    const response = await api.get(`/api/tasks/${id}`);
    return response.data;
};

export const createTask = async (data: TaskCreate): Promise<Task> => {
    const response = await api.post('/api/tasks/', data);
    return response.data;
};

export const updateTask = async (id: number, data: TaskUpdate): Promise<Task> => {
    const response = await api.put(`/api/tasks/${id}`, data);
    return response.data;
};

export const deleteTask = async (id: number): Promise<void> => {
    await api.delete(`/api/tasks/${id}`);
};
