import api from './axios';
import type { Expense, ExpenseCreate, ExpenseUpdate } from '../types';

export const getExpenses = async (): Promise<Expense[]> => {
    const response = await api.get('/api/expenses/');
    return response.data;
};

export const getExpense = async (id: number): Promise<Expense> => {
    const response = await api.get(`/api/expenses/${id}`);
    return response.data;
};

export const createExpense = async (data: ExpenseCreate): Promise<Expense> => {
    const response = await api.post('/api/expenses/', data);
    return response.data;
};

export const updateExpense = async (id: number, data: ExpenseUpdate): Promise<Expense> => {
    const response = await api.put(`/api/expenses/${id}`, data);
    return response.data;
};

export const deleteExpense = async (id: number): Promise<void> => {
    await api.delete(`/api/expenses/${id}`);
};
