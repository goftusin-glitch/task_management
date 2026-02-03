import React, { useState, useEffect } from 'react';
import type { Client, ClientCreate } from '../types';
import { getClients, updateClient } from '../api/clients';
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
    IconButton,
    Alert,
    CircularProgress,
    Tooltip,
    Stack,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import InboxIcon from '@mui/icons-material/Inbox';

const FollowUps: React.FC = () => {
    const { isAdmin } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState<ClientCreate>({
        name: '',
        email: '',
        phone: '',
        status: 'follow_up',
        custom_fields: {},
    });
    const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]);
    const [error, setError] = useState('');

    const fetchClients = async () => {
        try {
            const data = await getClients();
            // Filter clients with status 'follow_up'
            const followUps = data.filter((client: Client) => client.status === 'follow_up');
            setClients(followUps);
        } catch (err) {
            console.error('Error fetching clients:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const openEditModal = (client: Client) => {
        setEditingClient(client);
        setFormData({
            name: client.name,
            email: client.email || '',
            phone: client.phone,
            status: client.status || 'follow_up',
            custom_fields: client.custom_fields || {},
        });
        setCustomFields(
            Object.entries(client.custom_fields || {}).map(([key, value]) => ({ key, value }))
        );
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const custom_fields: Record<string, string> = {};
        customFields.forEach((field) => {
            if (field.key.trim()) custom_fields[field.key.trim()] = field.value;
        });
        const submitData = { ...formData, custom_fields };
        try {
            if (editingClient) {
                await updateClient(editingClient.id, submitData);
            }
            setShowModal(false);
            fetchClients();
        } catch (err: unknown) {
            if (err instanceof Error && 'response' in err) {
                const axiosError = err as { response?: { data?: { detail?: string } } };
                setError(axiosError.response?.data?.detail || 'Operation failed');
            } else {
                setError('Operation failed');
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
                <Typography variant="h4">Follow Ups</Typography>
            </Box>

            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                {clients.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                        <InboxIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">No follow ups found</Typography>
                        <Typography variant="body2" color="text.secondary">Mark clients as "Follow Up" to see them here</Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Phone</TableCell>
                                    {/* Dynamic headers for custom fields */}
                                    {Array.from(new Set(clients.flatMap(c => Object.keys(c.custom_fields || {})))).map(key => (
                                        <TableCell key={key} sx={{ textTransform: 'capitalize' }}>{key}</TableCell>
                                    ))}
                                    <TableCell>Created At</TableCell>
                                    <TableCell>Updated At</TableCell>
                                    {isAdmin && <TableCell align="right">Actions</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {clients.map((client) => (
                                    <TableRow key={client.id} hover>
                                        <TableCell>{client.id}</TableCell>
                                        <TableCell sx={{ fontWeight: 500 }}>{client.name}</TableCell>
                                        <TableCell>{client.email || '-'}</TableCell>
                                        <TableCell>{client.phone}</TableCell>
                                        {/* Dynamic cells for custom fields */}
                                        {Array.from(new Set(clients.flatMap(c => Object.keys(c.custom_fields || {})))).map(key => (
                                            <TableCell key={key}>
                                                {client.custom_fields?.[key] || '-'}
                                            </TableCell>
                                        ))}
                                        <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(client.created_at)}</TableCell>
                                        <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(client.updated_at)}</TableCell>
                                        {isAdmin && (
                                            <TableCell align="right">
                                                <Tooltip title="Edit">
                                                    <IconButton size="small" onClick={() => openEditModal(client)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>Edit Client Status</DialogTitle>
                    <DialogContent dividers>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            <TextField
                                label="Name"
                                value={formData.name}
                                disabled
                            />
                            <TextField
                                select
                                label="Status"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                SelectProps={{
                                    native: true,
                                }}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="follow_up">Follow Up</option>
                                <option value="pending">Pending</option>
                            </TextField>
                            <TextField
                                label="Email"
                                type="email"
                                value={formData.email}
                                disabled
                            />
                            <TextField
                                label="Phone"
                                type="tel"
                                value={formData.phone}
                                disabled
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">Update</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default FollowUps;
