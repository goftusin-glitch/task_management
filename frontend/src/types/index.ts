export interface User {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
    page_access: string[];
    created_at: string;
    updated_at: string;
}

export interface UserCreate {
    name: string;
    email: string;
    password: string;
    is_admin: boolean;
    page_access: string[];
}

export interface UserUpdate {
    name?: string;
    email?: string;
    password?: string;
    is_admin?: boolean;
    page_access?: string[];
}

export interface Client {
    id: number;
    name: string;
    email?: string;
    phone: string;
    status: string;
    custom_fields: Record<string, string>;
    created_by?: number;
    created_at: string;
    updated_at: string;
}

export interface ClientCreate {
    name: string;
    email?: string;
    phone: string;
    status?: string;
    custom_fields?: Record<string, string>;
}

export interface ClientUpdate {
    name?: string;
    email?: string;
    phone?: string;
    status?: string;
    custom_fields?: Record<string, string>;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
    id: number;
    client_id: number;
    details: string;
    assigned_to: number;
    status: TaskStatus;
    start_date?: string;
    end_date?: string;
    created_by?: number;
    created_at: string;
    updated_at: string;
    client_name?: string;
    assignee_name?: string;
}

export interface TaskCreate {
    client_id: number;
    details: string;
    assigned_to: number;
    status?: TaskStatus;
    start_date?: string;
    end_date?: string;
}

export interface TaskUpdate {
    client_id?: number;
    details?: string;
    assigned_to?: number;
    status?: TaskStatus;
    start_date?: string;
    end_date?: string;
}

export interface Expense {
    id: number;
    details: string;
    amount: number;
    custom_fields: Record<string, string>;
    created_by?: number;
    created_at: string;
    updated_at: string;
}

export interface ExpenseCreate {
    details: string;
    amount: number;
    custom_fields?: Record<string, string>;
}

export interface ExpenseUpdate {
    details?: string;
    amount?: number;
    custom_fields?: Record<string, string>;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface AuthToken {
    access_token: string;
    token_type: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    pageAccess: string[];
    loading?: boolean;
}
