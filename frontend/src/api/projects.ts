import axiosInstance from './axios';

export interface ProjectUser {
    id: number;
    name: string;
    email: string;
}

export interface ProjectClient {
    id: number;
    name: string;
    phone: string;
}

export interface Project {
    id: number;
    name: string;
    details: string | null;
    client_id: number | null;
    status: string;
    created_by: number | null;
    created_at: string;
    updated_at: string;
    assigned_users: ProjectUser[];
    client: ProjectClient | null;
}

export interface ProjectCreate {
    name: string;
    details?: string;
    client_id?: number;
    status?: string;
    assigned_user_ids?: number[];
}

export interface ProjectUpdate {
    name?: string;
    details?: string;
    client_id?: number;
    status?: string;
    assigned_user_ids?: number[];
}

export const getProjects = async (): Promise<Project[]> => {
    const response = await axiosInstance.get('/api/projects');
    return response.data;
};

export const getProject = async (id: number): Promise<Project> => {
    const response = await axiosInstance.get(`/api/projects/${id}`);
    return response.data;
};

export const createProject = async (data: ProjectCreate): Promise<Project> => {
    const response = await axiosInstance.post('/api/projects', data);
    return response.data;
};

export const updateProject = async (id: number, data: ProjectUpdate): Promise<Project> => {
    const response = await axiosInstance.put(`/api/projects/${id}`, data);
    return response.data;
};

export const deleteProject = async (id: number): Promise<void> => {
    await axiosInstance.delete(`/api/projects/${id}`);
};
