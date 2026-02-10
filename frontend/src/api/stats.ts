import api from './axios';

export interface DashboardStats {
    clients_count: number;
    follow_ups_count: number;
    clients_pending_count: number;
    tasks_count: number;
    tasks_pending_count: number;
    users_count?: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const response = await api.get('/api/stats/');
    return response.data;
};
