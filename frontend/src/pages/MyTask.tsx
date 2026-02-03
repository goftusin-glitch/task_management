import React, { useState, useEffect } from 'react';
import type { Task, TaskStatus } from '../types';
import { getMyTasks, getAllTasks, updateTask } from '../api/tasks';
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
    Alert,
    CircularProgress,
    Chip,
} from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

const statusColors: Record<TaskStatus, 'default' | 'warning' | 'info' | 'success'> = {
    pending: 'warning',
    in_progress: 'info',
    completed: 'success',
};

const getStatusLabel = (status: TaskStatus) => {
    return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const MyTask: React.FC = () => {
    const { isAdmin } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [newStatus, setNewStatus] = useState<TaskStatus>('pending');
    const [error, setError] = useState('');

    const fetchTasks = async () => {
        try {
            const data = isAdmin ? await getAllTasks() : await getMyTasks();
            setTasks(data);
        } catch (err) {
            console.error('Error fetching tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const formatDate = (dateString: string) => new Date(dateString).toLocaleString();
    const formatDateOnly = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    const openUpdateModal = (task: Task) => {
        setSelectedTask(task);
        setNewStatus(task.status);
        setError('');
        setShowModal(true);
    };

    const handleStatusUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTask) return;
        try {
            await updateTask(selectedTask.id, { status: newStatus });
            setShowModal(false);
            fetchTasks();
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
            <Typography variant="h4" sx={{ mb: 1 }}>
                {isAdmin ? 'Assigned Tasks' : 'My Tasks'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {isAdmin
                    ? 'Showing all tasks assigned to users'
                    : 'Showing tasks assigned to you'}
            </Typography>

            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                {tasks.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                        <InboxIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            {isAdmin ? 'No tasks assigned yet' : 'No tasks assigned to you'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {isAdmin ? 'Tasks assigned to users will appear here' : 'Tasks assigned to you will appear here'}
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Client Name</TableCell>
                                    <TableCell>Work Details</TableCell>
                                    {isAdmin && <TableCell>Assigned To</TableCell>}
                                    <TableCell>Start Date</TableCell>
                                    <TableCell>End Date</TableCell>
                                    <TableCell>Status</TableCell>
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
                                        {isAdmin && <TableCell>{task.assignee_name || '-'}</TableCell>}
                                        <TableCell sx={{ fontSize: '0.8rem' }}>{formatDateOnly(task.start_date)}</TableCell>
                                        <TableCell sx={{ fontSize: '0.8rem' }}>{formatDateOnly(task.end_date)}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getStatusLabel(task.status)}
                                                size="small"
                                                color={statusColors[task.status]}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(task.created_at)}</TableCell>
                                        <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(task.updated_at)}</TableCell>
                                        <TableCell align="right">
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => openUpdateModal(task)}
                                            >
                                                Update
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <Dialog open={showModal && !!selectedTask} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
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
                        {isAdmin && selectedTask?.assignee_name && (
                            <Box sx={{ mb: 2.5 }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Assigned To</Typography>
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                    <Typography variant="body2">{selectedTask.assignee_name}</Typography>
                                </Paper>
                            </Box>
                        )}
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
                        <Button onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">Update Status</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default MyTask;
