import React, { useState, useEffect, useMemo } from 'react';
import type { Client, ClientCreate } from '../types';
import { getClients, createClient, updateClient, deleteClient } from '../api/clients';
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
    MenuItem,
    InputAdornment,
    Select,
    FormControl,
    InputLabel,
    Popover,
    Badge,
    Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import InboxIcon from '@mui/icons-material/Inbox';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FilterListIcon from '@mui/icons-material/FilterList';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ClearIcon from '@mui/icons-material/Clear';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// Common country codes
const COUNTRY_CODES = [
    { code: '+91', country: 'India' },
    { code: '+1', country: 'USA/Canada' },
    { code: '+44', country: 'UK' },
    { code: '+971', country: 'UAE' },
    { code: '+966', country: 'Saudi Arabia' },
    { code: '+65', country: 'Singapore' },
    { code: '+61', country: 'Australia' },
    { code: '+49', country: 'Germany' },
    { code: '+33', country: 'France' },
    { code: '+81', country: 'Japan' },
    { code: '+86', country: 'China' },
];

const Clients: React.FC = () => {
    const { isAdmin } = useAuth();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState<ClientCreate>({
        name: '',
        email: '',
        phone: '',
        status: 'active',
        custom_fields: {},
    });
    const [countryCode, setCountryCode] = useState('+91');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]);
    const [error, setError] = useState('');

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ open: false, title: '', message: '', onConfirm: () => { } });

    // Filter popover
    const [filterAnchor, setFilterAnchor] = useState<HTMLButtonElement | null>(null);

    // Date range filter state (staged = inside popover, applied = active filter)
    const [stagedFromDate, setStagedFromDate] = useState('');
    const [stagedToDate, setStagedToDate] = useState('');
    const [appliedFromDate, setAppliedFromDate] = useState('');
    const [appliedToDate, setAppliedToDate] = useState('');

    const fetchClients = async () => {
        try {
            const data = await getClients();
            setClients(data);
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

    const formatReadableDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // Filter logic
    const isFiltered = appliedFromDate || appliedToDate;

    const filteredClients = useMemo(() => {
        if (!appliedFromDate && !appliedToDate) return clients;
        return clients.filter((client) => {
            const d = new Date(client.created_at);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (appliedFromDate && dateStr < appliedFromDate) return false;
            if (appliedToDate && dateStr > appliedToDate) return false;
            return true;
        });
    }, [clients, appliedFromDate, appliedToDate]);

    const getFilterLabel = () => {
        if (appliedFromDate && appliedToDate) {
            return `${formatReadableDate(appliedFromDate)} - ${formatReadableDate(appliedToDate)}`;
        }
        if (appliedFromDate) return `From ${formatReadableDate(appliedFromDate)}`;
        if (appliedToDate) return `Until ${formatReadableDate(appliedToDate)}`;
        return 'All Time';
    };

    // Popover handlers
    const openFilter = (e: React.MouseEvent<HTMLButtonElement>) => {
        setStagedFromDate(appliedFromDate);
        setStagedToDate(appliedToDate);
        setFilterAnchor(e.currentTarget);
    };

    const closeFilter = () => setFilterAnchor(null);

    const applyFilter = () => {
        setAppliedFromDate(stagedFromDate);
        setAppliedToDate(stagedToDate);
        closeFilter();
    };

    const clearFilters = () => {
        setAppliedFromDate('');
        setAppliedToDate('');
        setStagedFromDate('');
        setStagedToDate('');
        closeFilter();
    };

    // Export to Excel function
    const handleExport = () => {
        // Get all custom field keys from filtered clients
        const allCustomKeys = Array.from(new Set(filteredClients.flatMap(c => Object.keys(c.custom_fields || {}))));

        // Prepare data for Excel
        const exportData = filteredClients.map(client => {
            const baseData: Record<string, string | number> = {
                'ID': client.id,
                'Name': client.name,
                'Email': client.email || '',
                'Phone': client.phone,
                'Status': client.status || '',
            };

            // Add custom fields
            allCustomKeys.forEach(key => {
                baseData[key] = client.custom_fields?.[key] || '';
            });

            baseData['Created At'] = formatDate(client.created_at);
            baseData['Updated At'] = formatDate(client.updated_at);

            return baseData;
        });

        // Create worksheet and workbook
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');

        // Generate filename with date range if filtered
        let filename = 'clients';
        if (appliedFromDate && appliedToDate) {
            filename += `_${appliedFromDate}_to_${appliedToDate}`;
        } else if (appliedFromDate) {
            filename += `_from_${appliedFromDate}`;
        } else if (appliedToDate) {
            filename += `_until_${appliedToDate}`;
        }
        filename += '.xlsx';

        // Download
        XLSX.writeFile(workbook, filename);
    };

    const parsePhoneNumber = (fullPhone: string) => {
        // Try to match country code
        for (const cc of COUNTRY_CODES) {
            if (fullPhone.startsWith(cc.code)) {
                return { code: cc.code, number: fullPhone.slice(cc.code.length) };
            }
        }
        // Default to +91 if no match
        return { code: '+91', number: fullPhone.replace(/^\+\d+/, '') };
    };

    const openCreateModal = () => {
        setEditingClient(null);
        setFormData({ name: '', email: '', phone: '', status: 'active', custom_fields: {} });
        setCountryCode('+91');
        setPhoneNumber('');
        setPhoneError('');
        setCustomFields([]);
        setError('');
        setShowModal(true);
    };

    const openEditModal = (client: Client) => {
        setEditingClient(client);
        const parsed = parsePhoneNumber(client.phone);
        setFormData({
            name: client.name,
            email: client.email || '',
            phone: client.phone,
            status: client.status || 'active',
            custom_fields: client.custom_fields || {},
        });
        setCountryCode(parsed.code);
        setPhoneNumber(parsed.number);
        setPhoneError('');
        setCustomFields(
            Object.entries(client.custom_fields || {}).map(([key, value]) => ({ key, value }))
        );
        setError('');
        setShowModal(true);
    };

    const validatePhoneNumber = (number: string): boolean => {
        const digitsOnly = number.replace(/\D/g, '');
        if (digitsOnly.length !== 10) {
            setPhoneError('Phone number must be exactly 10 digits');
            return false;
        }
        setPhoneError('');
        return true;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
        setPhoneNumber(value);
        if (value.length === 10) {
            setPhoneError('');
        }
    };

    const checkDuplicate = (): boolean => {
        const fullPhone = countryCode + phoneNumber;
        const duplicate = clients.find(c =>
            c.phone === fullPhone && (!editingClient || c.id !== editingClient.id)
        );
        if (duplicate) {
            setError(`A client with phone number ${fullPhone} already exists (${duplicate.name})`);
            return true;
        }
        return false;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate phone number
        if (!validatePhoneNumber(phoneNumber)) {
            return;
        }

        // Check for duplicates
        if (checkDuplicate()) {
            return;
        }

        const custom_fields: Record<string, string> = {};
        customFields.forEach((field) => {
            if (field.key.trim()) custom_fields[field.key.trim()] = field.value;
        });

        const fullPhone = countryCode + phoneNumber;
        const submitData = { ...formData, phone: fullPhone, custom_fields };

        try {
            if (editingClient) {
                await updateClient(editingClient.id, submitData);
            } else {
                await createClient(submitData);
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

    const handleDelete = (id: number, clientName: string) => {
        setConfirmDialog({
            open: true,
            title: 'Delete Client',
            message: `Are you sure you want to delete "${clientName}"? This action cannot be undone.`,
            onConfirm: async () => {
                try {
                    await deleteClient(id);
                    fetchClients();
                } catch (err: unknown) {
                    if (err instanceof Error && 'response' in err) {
                        const axiosError = err as { response?: { data?: { detail?: string } } };
                        setError(axiosError.response?.data?.detail || 'Failed to delete client');
                    } else {
                        setError('Failed to delete client');
                    }
                }
                setConfirmDialog(prev => ({ ...prev, open: false }));
            },
        });
    };

    const addCustomField = () => {
        setCustomFields([...customFields, { key: '', value: '' }]);
    };

    const updateCustomField = (index: number, field: 'key' | 'value', value: string) => {
        const updated = [...customFields];
        updated[index][field] = value;
        setCustomFields(updated);
    };

    const removeCustomField = (index: number) => {
        setCustomFields(customFields.filter((_, i) => i !== index));
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
            {/* Header Row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Clients</Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    {/* Filter Icon Button */}
                    <Tooltip title="Filter by date range">
                        <IconButton
                            onClick={openFilter}
                            sx={{
                                border: '1px solid',
                                borderColor: isFiltered ? 'secondary.main' : 'divider',
                                borderRadius: 2,
                                bgcolor: isFiltered ? 'rgba(233, 69, 96, 0.08)' : 'transparent',
                                px: 1.5,
                                py: 1,
                                '&:hover': {
                                    bgcolor: isFiltered ? 'rgba(233, 69, 96, 0.15)' : 'action.hover',
                                },
                            }}
                        >
                            <Badge
                                color="secondary"
                                variant="dot"
                                invisible={!isFiltered}
                            >
                                <DateRangeIcon sx={{ color: isFiltered ? 'secondary.main' : 'text.secondary' }} />
                            </Badge>
                        </IconButton>
                    </Tooltip>

                    {/* Export Button */}
                    <Button
                        variant="outlined"
                        startIcon={<FileDownloadIcon />}
                        onClick={handleExport}
                        disabled={filteredClients.length === 0}
                    >
                        Export
                    </Button>

                    <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateModal}>
                        Add Client
                    </Button>
                </Stack>
            </Box>

            {/* Filter Popover */}
            <Popover
                open={Boolean(filterAnchor)}
                anchorEl={filterAnchor}
                onClose={closeFilter}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                    paper: {
                        sx: { borderRadius: 3, mt: 1, width: 340, overflow: 'visible' },
                    },
                }}
            >
                <Box sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
                        <FilterListIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            Filter by Date Range
                        </Typography>
                    </Stack>

                    <Stack spacing={2.5}>
                        <TextField
                            label="From Date"
                            type="date"
                            value={stagedFromDate}
                            onChange={(e) => setStagedFromDate(e.target.value)}
                            slotProps={{ inputLabel: { shrink: true } }}
                            size="small"
                            fullWidth
                        />
                        <TextField
                            label="To Date"
                            type="date"
                            value={stagedToDate}
                            onChange={(e) => setStagedToDate(e.target.value)}
                            slotProps={{
                                inputLabel: { shrink: true },
                                htmlInput: { min: stagedFromDate || undefined },
                            }}
                            size="small"
                            fullWidth
                        />
                    </Stack>

                    <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ClearIcon />}
                            onClick={clearFilters}
                            fullWidth
                            disabled={!stagedFromDate && !stagedToDate && !isFiltered}
                        >
                            Clear
                        </Button>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<FilterListIcon />}
                            onClick={applyFilter}
                            fullWidth
                            disabled={!stagedFromDate && !stagedToDate}
                        >
                            Apply Filter
                        </Button>
                    </Stack>
                </Box>
            </Popover>

            {/* Active Filter Chip */}
            {isFiltered && (
                <Box sx={{ mb: 2 }}>
                    <Chip
                        icon={<DateRangeIcon />}
                        label={getFilterLabel()}
                        onDelete={clearFilters}
                        color="secondary"
                        variant="outlined"
                        sx={{ fontWeight: 500 }}
                    />
                </Box>
            )}

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                {filteredClients.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                        <InboxIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            {isFiltered ? 'No clients found for the selected period' : 'No clients found'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {isFiltered ? 'Try changing the date range or clear the filter' : 'Create your first client to get started'}
                        </Typography>
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
                                    {Array.from(new Set(filteredClients.flatMap(c => Object.keys(c.custom_fields || {})))).map(key => (
                                        <TableCell key={key} sx={{ textTransform: 'capitalize' }}>{key}</TableCell>
                                    ))}
                                    <TableCell>Created At</TableCell>
                                    <TableCell>Updated At</TableCell>
                                    {isAdmin && <TableCell align="right">Actions</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredClients.map((client) => (
                                    <TableRow key={client.id} hover>
                                        <TableCell>{client.id}</TableCell>
                                        <TableCell sx={{ fontWeight: 500 }}>{client.name}</TableCell>
                                        <TableCell>{client.email || '-'}</TableCell>
                                        <TableCell>{client.phone}</TableCell>
                                        {/* Dynamic cells for custom fields */}
                                        {Array.from(new Set(filteredClients.flatMap(c => Object.keys(c.custom_fields || {})))).map(key => (
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
                                                <Tooltip title="Delete">
                                                    <IconButton size="small" color="error" onClick={() => handleDelete(client.id, client.name)}>
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

            {/* Create/Edit Client Dialog */}
            <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>{editingClient ? 'Edit Client' : 'Add Client'}</DialogTitle>
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
                            />

                            {/* Phone Number with Country Code */}
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Phone Number *</Typography>
                                <Stack direction="row" spacing={1}>
                                    <FormControl sx={{ minWidth: 130 }}>
                                        <InputLabel id="country-code-label">Code</InputLabel>
                                        <Select
                                            labelId="country-code-label"
                                            value={countryCode}
                                            label="Code"
                                            size="small"
                                            onChange={(e) => setCountryCode(e.target.value)}
                                        >
                                            {COUNTRY_CODES.map((cc) => (
                                                <MenuItem key={cc.code} value={cc.code}>
                                                    {cc.code} ({cc.country})
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <TextField
                                        label="Phone Number"
                                        value={phoneNumber}
                                        onChange={handlePhoneChange}
                                        required
                                        error={!!phoneError}
                                        helperText={phoneError || 'Enter 10 digit number'}
                                        placeholder="9876543210"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    {countryCode}
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{ flex: 1 }}
                                    />
                                </Stack>
                            </Box>

                            <TextField
                                select
                                label="Status"
                                value={formData.status || 'active'}
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
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Custom Fields</Typography>
                                <Stack spacing={1.5}>
                                    {customFields.map((field, index) => (
                                        <Stack direction="row" spacing={1} key={index} alignItems="center">
                                            <TextField
                                                placeholder="Key"
                                                value={field.key}
                                                onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                                                size="small"
                                            />
                                            <TextField
                                                placeholder="Value"
                                                value={field.value}
                                                onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                                                size="small"
                                            />
                                            <IconButton size="small" color="error" onClick={() => removeCustomField(index)}>
                                                <RemoveCircleOutlineIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    ))}
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={addCustomField}
                                        sx={{ alignSelf: 'flex-start' }}
                                    >
                                        Add Field
                                    </Button>
                                </Stack>
                            </Box>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">{editingClient ? 'Update' : 'Create'}</Button>
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

export default Clients;
