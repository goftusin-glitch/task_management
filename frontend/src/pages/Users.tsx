import React, { useState, useEffect } from 'react';
import type { User, UserCreate } from '../types';
import { getUsers, createUser, updateUser, deleteUser } from '../api/users';
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControlLabel,
    Switch,
    Checkbox,
    FormGroup,
    Chip,
    IconButton,
    Alert,
    CircularProgress,
    Tooltip,
    Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import InboxIcon from '@mui/icons-material/Inbox';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const PAGE_OPTIONS = [
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'users', label: 'Users' },
    { value: 'clients', label: 'Clients' },
    { value: 'follow_ups', label: 'Follow Ups' },
    { value: 'tasks', label: 'Tasks' },
    { value: 'my_task', label: 'My Task' },
    { value: 'my_progress', label: 'My Progress' },
    { value: 'completed_task', label: 'Completed Task' },
    { value: 'expenses', label: 'Expenses' },
    { value: 'projects', label: 'Projects' },
];

const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<UserCreate>({
        name: '',
        email: '',
        password: '',
        is_admin: false,
        page_access: [],
    });
    const [error, setError] = useState('');

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ open: false, title: '', message: '', onConfirm: () => { } });

    const fetchUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', is_admin: false, page_access: [] });
        setError('');
        setShowModal(true);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            is_admin: user.is_admin,
            page_access: user.page_access || [],
        });
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (editingUser) {
                const updateData: Partial<UserCreate> = {
                    name: formData.name,
                    email: formData.email,
                    is_admin: formData.is_admin,
                    page_access: formData.page_access,
                };
                if (formData.password) updateData.password = formData.password;
                await updateUser(editingUser.id, updateData);
            } else {
                await createUser(formData);
            }
            setShowModal(false);
            fetchUsers();
        } catch (err: unknown) {
            if (err instanceof Error && 'response' in err) {
                const axiosError = err as { response?: { data?: { detail?: string } } };
                setError(axiosError.response?.data?.detail || 'Operation failed');
            } else {
                setError('Operation failed');
            }
        }
    };

    const handleDelete = (id: number, userName: string) => {
        setConfirmDialog({
            open: true,
            title: 'Delete User',
            message: `Are you sure you want to delete "${userName}"? This action cannot be undone.`,
            onConfirm: async () => {
                try {
                    await deleteUser(id);
                    fetchUsers();
                } catch (err: unknown) {
                    if (err instanceof Error && 'response' in err) {
                        const axiosError = err as { response?: { data?: { detail?: string } } };
                        setError(axiosError.response?.data?.detail || 'Failed to delete user');
                    } else {
                        setError('Failed to delete user');
                    }
                }
                setConfirmDialog(prev => ({ ...prev, open: false }));
            },
        });
    };

    const togglePageAccess = (page: string) => {
        setFormData((prev) => ({
            ...prev,
            page_access: prev.page_access.includes(page)
                ? prev.page_access.filter((p) => p !== page)
                : [...prev.page_access, page],
        }));
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Users</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateModal}>
                    Add User
                </Button>
            </Box>

            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                {users.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                        <InboxIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">No users found</Typography>
                        <Typography variant="body2" color="text.secondary">Create your first user to get started</Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>Page Access</TableCell>
                                    <TableCell>Created At</TableCell>
                                    <TableCell>Updated At</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id} hover>
                                        <TableCell>{user.id}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                                {user.name}
                                            </Box>
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            {user.is_admin ? (
                                                <Chip label="Admin" size="small" color="secondary" />
                                            ) : (
                                                <Chip label="User" size="small" variant="outlined" />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                                {user.page_access?.length > 0
                                                    ? user.page_access.map((p) => (
                                                        <Chip key={p} label={p} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                                                    ))
                                                    : '-'}
                                            </Stack>
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(user.created_at)}</TableCell>
                                        <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(user.updated_at)}</TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Edit">
                                                <IconButton size="small" onClick={() => openEditModal(user)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete">
                                                <IconButton size="small" color="error" onClick={() => handleDelete(user.id, user.name)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>{editingUser ? 'Edit User' : 'Add User'}</DialogTitle>
                    <DialogContent dividers>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            <TextField
                                label="Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <TextField
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                            <TextField
                                label={editingUser ? 'Password (leave blank to keep current)' : 'Password'}
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required={!editingUser}
                            />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formData.is_admin}
                                        onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                                        color="secondary"
                                    />
                                }
                                label="Admin privileges"
                            />
                            {!formData.is_admin && (
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Page Access</Typography>
                                    <FormGroup>
                                        {PAGE_OPTIONS.map((option) => (
                                            <FormControlLabel
                                                key={option.value}
                                                control={
                                                    <Checkbox
                                                        checked={formData.page_access.includes(option.value)}
                                                        onChange={() => togglePageAccess(option.value)}
                                                        size="small"
                                                    />
                                                }
                                                label={option.label}
                                            />
                                        ))}
                                    </FormGroup>
                                </Box>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">{editingUser ? 'Update' : 'Create'}</Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmDialog.open}
                onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmberIcon color="warning" />
                    {confirmDialog.title}
                </DialogTitle>
                <DialogContent>
                    <Typography>{confirmDialog.message}</Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={confirmDialog.onConfirm}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Users;
