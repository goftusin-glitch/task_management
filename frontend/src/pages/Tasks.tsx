import React, { useState, useEffect } from 'react';
import type { Task, TaskCreate, TaskStatus, Client, User } from '../types';
import { getAllTasks, createTask, updateTask, deleteTask } from '../api/tasks';
import { getClients } from '../api/clients';
import { getUsers } from '../api/users';
import { useAuth } from '../context/AuthContext';
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
    MenuItem,
    IconButton,
    Alert,
    CircularProgress,
    Tooltip,
    Stack,
    Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InboxIcon from '@mui/icons-material/Inbox';

const statusColors: Record<TaskStatus, 'default' | 'warning' | 'info' | 'success'> = {
    pending: 'warning',
    in_progress: 'info',
    completed: 'success',
};

const getStatusLabel = (status: TaskStatus) => {
    return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const Tasks: React.FC = () => {
    const { isAdmin } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [formData, setFormData] = useState<TaskCreate>({
        client_id: 0,
        details: '',
        assigned_to: 0,
        status: 'pending',
        start_date: '',
        end_date: '',
    });
    const [error, setError] = useState('');

    // Status-only update state (for non-admin users)
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [newStatus, setNewStatus] = useState<TaskStatus>('pending');

    const fetchData = async () => {
        try {
            const [tasksData, clientsData, usersData] = await Promise.all([
                getAllTasks(),
                getClients(),
                getUsers(),
            ]);
            setTasks(tasksData);
            setClients(clientsData);
            setUsers(usersData);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const formatDate = (dateString: string) => new Date(dateString).toLocaleString();
    const formatDateOnly = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    // Admin: full CRUD modal
    const openCreateModal = () => {
        setEditingTask(null);
        setFormData({
            client_id: clients[0]?.id || 0,
            details: '',
            assigned_to: users[0]?.id || 0,
            status: 'pending',
            start_date: '',
            end_date: '',
        });
        setError('');
        setShowModal(true);
    };

    const openEditModal = (task: Task) => {
        setEditingTask(task);
        setFormData({
            client_id: task.client_id,
            details: task.details,
            assigned_to: task.assigned_to,
            status: task.status,
            start_date: task.start_date || '',
            end_date: task.end_date || '',
        });
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (editingTask) {
                await updateTask(editingTask.id, formData);
            } else {
                await createTask(formData);
            }
            setShowModal(false);
            fetchData();
        } catch (err: unknown) {
            if (err instanceof Error && 'response' in err) {
                const axiosError = err as { response?: { data?: { detail?: string } } };
                setError(axiosError.response?.data?.detail || 'Operation failed');
            } else {
                setError('Operation failed');
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await deleteTask(id);
                fetchData();
            } catch (err: unknown) {
                if (err instanceof Error && 'response' in err) {
                    const axiosError = err as { response?: { data?: { detail?: string } } };
                    alert(axiosError.response?.data?.detail || 'Failed to delete task');
                } else {
                    alert('Failed to delete task');
                }
            }
        }
    };

    // Non-admin: status-only update
    const openStatusModal = (task: Task) => {
        setSelectedTask(task);
        setNewStatus(task.status);
        setError('');
        setShowStatusModal(true);
    };

    const handleStatusUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTask) return;
        try {
            await updateTask(selectedTask.id, { status: newStatus });
            setShowStatusModal(false);
            fetchData();
        } catch (err: unknown) {
            if (err instanceof Error && 'response' in err) {
                const axiosError = err as { response?: { data?: { detail?: string } } };
                setError(axiosError.response?.data?.detail || 'Failed to update task');
            } else {
                setError('Failed to update task');
            }
        }
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
                <Typography variant="h4">Tasks</Typography>
                {isAdmin && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateModal}>
                        Add Task
                    </Button>
                )}
            </Box>

            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                {tasks.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                        <InboxIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">No tasks found</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {isAdmin ? 'Create your first task to get started' : 'No tasks have been assigned yet'}
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Client</TableCell>
                                    <TableCell>Details</TableCell>
                                    <TableCell>Assigned To</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Start Date</TableCell>
                                    <TableCell>End Date</TableCell>
                                    <TableCell>Created At</TableCell>
                                    <TableCell>Updated At</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tasks.map((task) => (
                                    <TableRow key={task.id} hover>
                                        <TableCell>{task.id}</TableCell>
                                        <TableCell sx={{ fontWeight: 500 }}>{task.client_name || '-'}</TableCell>
                                        <TableCell sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {task.details}
                                        </TableCell>
                                        <TableCell>{task.assignee_name || '-'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getStatusLabel(task.status)}
                                                size="small"
                                                color={statusColors[task.status]}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.8rem' }}>{formatDateOnly(task.start_date)}</TableCell>
                                        <TableCell sx={{ fontSize: '0.8rem' }}>{formatDateOnly(task.end_date)}</TableCell>
                                        <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(task.created_at)}</TableCell>
                                        <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(task.updated_at)}</TableCell>
                                        <TableCell align="right">
                                            {isAdmin ? (
                                                <>
                                                    <Tooltip title="Edit">
                                                        <IconButton size="small" onClick={() => openEditModal(task)}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete">
                                                        <IconButton size="small" color="error" onClick={() => handleDelete(task.id)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            ) : (
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => openStatusModal(task)}
                                                >
                                                    Update Status
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Admin: Full CRUD Dialog */}
            <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>{editingTask ? 'Edit Task' : 'Add Task'}</DialogTitle>
                    <DialogContent dividers>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            <TextField
                                select
                                label="Client"
                                value={formData.client_id}
                                onChange={(e) => setFormData({ ...formData, client_id: parseInt(e.target.value) })}
                                required
                            >
                                <MenuItem value="">Select Client</MenuItem>
                                {clients.map((client) => (
                                    <MenuItem key={client.id} value={client.id}>{client.name}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                label="Details"
                                multiline
                                rows={3}
                                value={formData.details}
                                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                                required
                            />
                            <TextField
                                select
                                label="Assigned To"
                                value={formData.assigned_to}
                                onChange={(e) => setFormData({ ...formData, assigned_to: parseInt(e.target.value) })}
                                required
                            >
                                <MenuItem value="">Select User</MenuItem>
                                {users.map((user) => (
                                    <MenuItem key={user.id} value={user.id}>
                                        {user.name} {user.is_admin && '(Admin)'}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                label="Status"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                            >
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="in_progress">In Progress</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                            </TextField>
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    label="Start Date"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                                <TextField
                                    label="End Date"
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            </Stack>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">{editingTask ? 'Update' : 'Create'}</Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Non-admin: Status-only Update Dialog */}
            <Dialog open={showStatusModal && !!selectedTask} onClose={() => setShowStatusModal(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleStatusUpdate}>
                    <DialogTitle>Update Task Status</DialogTitle>
                    <DialogContent dividers>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        <Box sx={{ mb: 2.5 }}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Task Details</Typography>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                <Typography variant="body2">{selectedTask?.details}</Typography>
                            </Paper>
                        </Box>
                        <Box sx={{ mb: 2.5 }}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Client</Typography>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                <Typography variant="body2">{selectedTask?.client_name}</Typography>
                            </Paper>
                        </Box>
                        <TextField
                            select
                            label="Status"
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
                            fullWidth
                        >
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="in_progress">In Progress</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                        </TextField>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setShowStatusModal(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">Update Status</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default Tasks;
