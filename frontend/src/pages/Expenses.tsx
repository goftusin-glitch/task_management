import React, { useState, useEffect, useMemo } from 'react';
import type { Expense, ExpenseCreate } from '../types';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../api/expenses';
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
    Card,
    CardContent,
    Chip,
    Popover,
    Badge,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import FilterListIcon from '@mui/icons-material/FilterList';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ClearIcon from '@mui/icons-material/Clear';
import InboxIcon from '@mui/icons-material/Inbox';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';

const Expenses: React.FC = () => {
    const { isAdmin } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [formData, setFormData] = useState<ExpenseCreate>({ details: '', amount: 0, custom_fields: {} });
    const [error, setError] = useState('');

    // Custom fields state
    const [newFieldKey, setNewFieldKey] = useState('');
    const [newFieldValue, setNewFieldValue] = useState('');

    // Filter popover
    const [filterAnchor, setFilterAnchor] = useState<HTMLButtonElement | null>(null);

    // Date range filter state (staged = inside popover, applied = active filter)
    const [stagedFromDate, setStagedFromDate] = useState('');
    const [stagedToDate, setStagedToDate] = useState('');
    const [appliedFromDate, setAppliedFromDate] = useState('');
    const [appliedToDate, setAppliedToDate] = useState('');

    const fetchExpenses = async () => {
        try {
            const data = await getExpenses();
            setExpenses(data);
        } catch (err) {
            console.error('Error fetching expenses:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const formatDisplayDate = (dateString: string) => new Date(dateString).toLocaleString();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
    };

    const formatReadableDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('default', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    // Filter logic
    const isFiltered = appliedFromDate || appliedToDate;

    const filteredExpenses = useMemo(() => {
        if (!appliedFromDate && !appliedToDate) return expenses;
        return expenses.filter((expense) => {
            const d = new Date(expense.created_at);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (appliedFromDate && dateStr < appliedFromDate) return false;
            if (appliedToDate && dateStr > appliedToDate) return false;
            return true;
        });
    }, [expenses, appliedFromDate, appliedToDate]);

    const filteredTotal = useMemo(() => {
        return filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    }, [filteredExpenses]);

    const overallTotal = useMemo(() => {
        return expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    }, [expenses]);

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
        const allCustomKeys = Array.from(new Set(filteredExpenses.flatMap(e => Object.keys(e.custom_fields || {}))));
        const exportData = filteredExpenses.map(expense => {
            const baseData: Record<string, string | number> = {
                'ID': expense.id,
                'Details': expense.details,
                'Amount': expense.amount,
            };
            // Add custom fields
            allCustomKeys.forEach(key => {
                baseData[key] = expense.custom_fields?.[key] || '';
            });
            baseData['Created At'] = formatDisplayDate(expense.created_at);
            baseData['Updated At'] = formatDisplayDate(expense.updated_at);
            return baseData;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');

        let filename = 'expenses';
        if (appliedFromDate && appliedToDate) {
            filename += `_${appliedFromDate}_to_${appliedToDate}`;
        } else if (appliedFromDate) {
            filename += `_from_${appliedFromDate}`;
        } else if (appliedToDate) {
            filename += `_until_${appliedToDate}`;
        }
        filename += '.xlsx';

        XLSX.writeFile(workbook, filename);
    };

    // CRUD handlers
    const openCreateModal = () => {
        setEditingExpense(null);
        setFormData({ details: '', amount: 0, custom_fields: {} });
        setNewFieldKey('');
        setNewFieldValue('');
        setError('');
        setShowModal(true);
    };

    const openEditModal = (expense: Expense) => {
        setEditingExpense(expense);
        setFormData({ details: expense.details, amount: expense.amount, custom_fields: expense.custom_fields || {} });
        setNewFieldKey('');
        setNewFieldValue('');
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (editingExpense) {
                await updateExpense(editingExpense.id, formData);
            } else {
                await createExpense(formData);
            }
            setShowModal(false);
            fetchExpenses();
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
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                await deleteExpense(id);
                fetchExpenses();
            } catch (err: unknown) {
                if (err instanceof Error && 'response' in err) {
                    const axiosError = err as { response?: { data?: { detail?: string } } };
                    alert(axiosError.response?.data?.detail || 'Failed to delete expense');
                } else {
                    alert('Failed to delete expense');
                }
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
            {/* Header Row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Expenses</Typography>
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
                        disabled={filteredExpenses.length === 0}
                    >
                        Export
                    </Button>

                    <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateModal}>
                        Add Expense
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

            {/* Total Expense Card */}
            <Card
                elevation={0}
                sx={{
                    mb: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    color: '#fff',
                }}
            >
                <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <AccountBalanceWalletIcon sx={{ fontSize: 36, opacity: 0.8 }} />
                        <Box>
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                {isFiltered ? `Expenses for ${getFilterLabel()}` : 'Total Expenses'}
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                {formatCurrency(filteredTotal)}
                            </Typography>
                        </Box>
                    </Box>
                    {isFiltered ? (
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>Overall Total</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, opacity: 0.85 }}>
                                {formatCurrency(overallTotal)}
                            </Typography>
                        </Box>
                    ) : (
                        <Chip
                            label={`${expenses.length} expense${expenses.length !== 1 ? 's' : ''}`}
                            sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600 }}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Expenses Table */}
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                {filteredExpenses.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8, px: 3 }}>
                        <InboxIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            {isFiltered ? 'No expenses found for the selected period' : 'No expenses found'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {isFiltered ? 'Try changing the date range or clear the filter' : 'Create your first expense to get started'}
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Details</TableCell>
                                    <TableCell>Amount</TableCell>
                                    {/* Dynamic headers for custom fields */}
                                    {Array.from(new Set(filteredExpenses.flatMap(e => Object.keys(e.custom_fields || {})))).map(key => (
                                        <TableCell key={key} sx={{ textTransform: 'capitalize' }}>{key}</TableCell>
                                    ))}
                                    <TableCell>Created At</TableCell>
                                    <TableCell>Updated At</TableCell>
                                    {isAdmin && <TableCell align="right">Actions</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredExpenses.map((expense) => (
                                    <TableRow key={expense.id} hover>
                                        <TableCell>{expense.id}</TableCell>
                                        <TableCell>{expense.details}</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>{formatCurrency(expense.amount)}</TableCell>
                                        {/* Dynamic cells for custom fields */}
                                        {Array.from(new Set(filteredExpenses.flatMap(e => Object.keys(e.custom_fields || {})))).map(key => (
                                            <TableCell key={key}>
                                                {expense.custom_fields?.[key] || '-'}
                                            </TableCell>
                                        ))}
                                        <TableCell sx={{ fontSize: '0.8rem' }}>{formatDisplayDate(expense.created_at)}</TableCell>
                                        <TableCell sx={{ fontSize: '0.8rem' }}>{formatDisplayDate(expense.updated_at)}</TableCell>
                                        {isAdmin && (
                                            <TableCell align="right">
                                                <Tooltip title="Edit">
                                                    <IconButton size="small" onClick={() => openEditModal(expense)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Delete">
                                                    <IconButton size="small" color="error" onClick={() => handleDelete(expense.id)}>
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

            {/* Add/Edit Expense Dialog */}
            <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
                    <DialogContent dividers>
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            <TextField
                                label="Details"
                                multiline
                                rows={3}
                                value={formData.details}
                                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                                required
                            />
                            <TextField
                                label="Amount"
                                type="number"
                                slotProps={{ htmlInput: { step: '0.01', min: '0' } }}
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                required
                            />

                            {/* Custom Fields Section */}
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                                    Custom Fields
                                </Typography>

                                {/* Existing custom fields */}
                                {Object.entries(formData.custom_fields || {}).map(([key, value]) => (
                                    <Stack key={key} direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                        <TextField
                                            size="small"
                                            label="Field Name"
                                            value={key}
                                            disabled
                                            sx={{ flex: 1 }}
                                        />
                                        <TextField
                                            size="small"
                                            label="Value"
                                            value={value}
                                            onChange={(e) => {
                                                const updated = { ...formData.custom_fields };
                                                updated[key] = e.target.value;
                                                setFormData({ ...formData, custom_fields: updated });
                                            }}
                                            sx={{ flex: 1 }}
                                        />
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => {
                                                const updated = { ...formData.custom_fields };
                                                delete updated[key];
                                                setFormData({ ...formData, custom_fields: updated });
                                            }}
                                        >
                                            <RemoveCircleIcon fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                ))}

                                {/* Add new custom field */}
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <TextField
                                        size="small"
                                        label="New Field Name"
                                        value={newFieldKey}
                                        onChange={(e) => setNewFieldKey(e.target.value)}
                                        sx={{ flex: 1 }}
                                    />
                                    <TextField
                                        size="small"
                                        label="Value"
                                        value={newFieldValue}
                                        onChange={(e) => setNewFieldValue(e.target.value)}
                                        sx={{ flex: 1 }}
                                    />
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => {
                                            if (newFieldKey.trim()) {
                                                setFormData({
                                                    ...formData,
                                                    custom_fields: {
                                                        ...formData.custom_fields,
                                                        [newFieldKey.trim()]: newFieldValue
                                                    }
                                                });
                                                setNewFieldKey('');
                                                setNewFieldValue('');
                                            }
                                        }}
                                        disabled={!newFieldKey.trim()}
                                    >
                                        Add
                                    </Button>
                                </Stack>
                            </Box>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <Button onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" variant="contained">{editingExpense ? 'Update' : 'Create'}</Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default Expenses;
