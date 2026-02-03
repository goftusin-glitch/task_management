import React, { useState, useEffect } from 'react';
import type { Project, ProjectCreate } from '../api/projects';
import { getProjects, createProject, updateProject, deleteProject } from '../api/projects';
import { getClients } from '../api/clients';
import { getUsers } from '../api/users';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';
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
    Chip,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    OutlinedInput,
    Checkbox,
    ListItemText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InboxIcon from '@mui/icons-material/Inbox';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FolderIcon from '@mui/icons-material/Folder';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

interface Client {
    id: number;
    name: string;
    phone: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
}

const STATUS_OPTIONS = [
    { value: 'active', label: 'Active', color: '#4caf50' },
    { value: 'inactive', label: 'Inactive', color: '#9e9e9e' },
    { value: 'follow_up', label: 'Follow Up', color: '#ff9800' },
    { value: 'pending', label: 'Pending', color: '#2196f3' },
];

const Projects: React.FC = () => {
    const { isAdmin } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [formData, setFormData] = useState<ProjectCreate>({
        name: '',
        details: '',
        client_id: undefined,
        status: 'active',
        assigned_user_ids: [],
    });
    const [error, setError] = useState('');

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ open: false, title: '', message: '', onConfirm: () => { } });

    const fetchData = async () => {
        try {
            const [projectsData, clientsData] = await Promise.all([
                getProjects(),
                getClients().catch(() => []), // Non-admins might not have access
            ]);
            setProjects(projectsData);
            setClients(clientsData);

            // Fetch users only if admin
            if (isAdmin) {
                try {
                    const usersData = await getUsers();
                    setUsers(usersData);
                } catch {
                    console.error('Error fetching users');
                }
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [isAdmin]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getStatusColor = (status: string) => {
        const statusOption = STATUS_OPTIONS.find(s => s.value === status);
        return statusOption?.color || '#9e9e9e';
    };

    const openCreateModal = () => {
        setEditingProject(null);
        setFormData({
            name: '',
            details: '',
            client_id: undefined,
            status: 'active',
            assigned_user_ids: [],
        });
        setError('');
        setShowModal(true);
    };

    const openEditModal = (project: Project) => {
        setEditingProject(project);
        setFormData({
            name: project.name,
            details: project.details || '',
            client_id: project.client_id || undefined,
            status: project.status,
            assigned_user_ids: project.assigned_users.map(u => u.id),
        });
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            if (editingProject) {
                await updateProject(editingProject.id, formData);
            } else {
                await createProject(formData);
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

    const handleDelete = (id: number, projectName: string) => {
        setConfirmDialog({
            open: true,
            title: 'Delete Project',
            message: `Are you sure you want to delete "${projectName}"? This action cannot be undone.`,
            onConfirm: async () => {
                try {
                    await deleteProject(id);
                    fetchData();
                } catch (err: unknown) {
                    if (err instanceof Error && 'response' in err) {
                        const axiosError = err as { response?: { data?: { detail?: string } } };
                        setError(axiosError.response?.data?.detail || 'Failed to delete project');
                    } else {
                        setError('Failed to delete project');
                    }
                }
                setConfirmDialog(prev => ({ ...prev, open: false }));
            },
        });
    };

    // Export to Excel function
    const handleExport = () => {
        const exportData = projects.map(project => ({
            'ID': project.id,
            'Project Name': project.name,
            'Details': project.details || '',
            'Client': project.client?.name || '-',
            'Status': project.status.replace('_', ' '),
            'Assigned To': project.assigned_users.map(u => u.name).join(', ') || '-',
            'Created At': formatDate(project.created_at),
            'Updated At': formatDate(project.updated_at),
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');
        XLSX.writeFile(workbook, 'projects.xlsx');
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
                <Typography variant="h4">Projects</Typography>
                <Stack direction="row" spacing={1.5}>
                    {/* Export Button */}
                    <Button
                        variant="outlined"
                        startIcon={<FileDownloadIcon />}
                        onClick={handleExport}
                        disabled={projects.length === 0}
                    >
                        Export
                    </Button>
                    {isAdmin && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateModal}>
                            Add Project
                        </Button>
                    )}
                </Stack>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                {projects.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                        <InboxIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">No projects found</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {isAdmin ? 'Create your first project to get started' : 'No projects assigned to you yet'}
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Project Name</TableCell>
                                    <TableCell>Client</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Assigned To</TableCell>
                                    <TableCell>Created At</TableCell>
                                    {isAdmin && <TableCell align="right">Actions</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {projects.map((project) => (
                                    <TableRow key={project.id} hover>
                                        <TableCell>{project.id}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <FolderIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                                                <Box>
                                                    <Typography sx={{ fontWeight: 500 }}>{project.name}</Typography>
                                                    {project.details && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                            {project.details.length > 50 ? project.details.slice(0, 50) + '...' : project.details}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>{project.client?.name || '-'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={project.status.replace('_', ' ')}
                                                size="small"
                                                sx={{
                                                    bgcolor: getStatusColor(project.status) + '20',
                                                    color: getStatusColor(project.status),
                                                    fontWeight: 500,
                                                    textTransform: 'capitalize'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                                {project.assigned_users.length > 0
                                                    ? project.assigned_users.map((user) => (
                                                        <Chip key={user.id} label={user.name} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                                                    ))
                                                    : '-'}
                                            </Stack>
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(project.created_at)}</TableCell>
                                        {isAdmin && (
                                            <TableCell align="right">
                                                <Tooltip title="Edit">
                                                    <IconButton size="small" onClick={() => openEditModal(project)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton size="small" color="error" onClick={() => handleDelete(project.id, project.name)}>
                                                        <DeleteIcon fontSize="small" />
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

            {/* Create/Edit Project Dialog */}
            <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>{editingProject ? 'Edit Project' : 'Add Project'}</DialogTitle>
                    <DialogContent dividers>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            <TextField
                                label="Project Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <TextField
                                label="Details"
                                value={formData.details}
                                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                                multiline
                                rows={3}
                            />
                            <FormControl fullWidth>
                                <InputLabel>Client</InputLabel>
                                <Select
                                    value={formData.client_id || ''}
                                    label="Client"
                                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value ? Number(e.target.value) : undefined })}
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {clients.map((client) => (
                                        <MenuItem key={client.id} value={client.id}>
                                            {client.name} ({client.phone})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField
                                select
                                label="Status"
                                value={formData.status || 'active'}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                SelectProps={{ native: true }}
                            >
                                {STATUS_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </TextField>
                            <FormControl fullWidth>
                                <InputLabel>Assign To</InputLabel>
                                <Select
                                    multiple
                                    value={formData.assigned_user_ids || []}
                                    onChange={(e) => setFormData({ ...formData, assigned_user_ids: e.target.value as number[] })}
                                    input={<OutlinedInput label="Assign To" />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {(selected as number[]).map((id) => {
                                                const user = users.find(u => u.id === id);
                                                return <Chip key={id} label={user?.name || id} size="small" />;
                                            })}
                                        </Box>
                                    )}
                                >
                                    {users.filter(u => !u.is_admin).map((user) => (
                                        <MenuItem key={user.id} value={user.id}>
                                            <Checkbox checked={(formData.assigned_user_ids || []).includes(user.id)} />
                                            <ListItemText primary={user.name} secondary={user.email} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">{editingProject ? 'Update' : 'Create'}</Button>
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

export default Projects;
