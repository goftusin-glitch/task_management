import React, { useState, useEffect } from 'react';
import type { Task, TaskStatus } from '../types';
import { getCompletedTasks } from '../api/tasks';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Chip,
} from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

const getStatusLabel = (status: TaskStatus) => {
    return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const CompletedTask: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        try {
            const data = await getCompletedTasks();
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

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 1 }}>Completed Tasks</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Showing all your completed tasks
            </Typography>

            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                {tasks.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                        <InboxIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">No completed tasks</Typography>
                        <Typography variant="body2" color="text.secondary">Tasks that you have completed will appear here</Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Client Name</TableCell>
                                    <TableCell>Work Details</TableCell>
                                    <TableCell>Start Date</TableCell>
                                    <TableCell>End Date</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Created At</TableCell>
                                    <TableCell>Completed At</TableCell>
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
                                        <TableCell sx={{ fontSize: '0.8rem' }}>{formatDateOnly(task.start_date)}</TableCell>
                                        <TableCell sx={{ fontSize: '0.8rem' }}>{formatDateOnly(task.end_date)}</TableCell>
                                        <TableCell>
                                            <Chip label={getStatusLabel(task.status)} size="small" color="success" />
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(task.created_at)}</TableCell>
                                        <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(task.updated_at)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </Box>
    );
};

export default CompletedTask;
