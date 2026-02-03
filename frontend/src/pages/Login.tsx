import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../api/auth';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    InputAdornment,
    IconButton,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    if (isAuthenticated) {
        return <Navigate to="/clients" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const token = await apiLogin(email, password);
            await login(token.access_token);
            navigate('/clients');
        } catch (err: unknown) {
            if (err instanceof Error && 'response' in err) {
                const axiosError = err as { response?: { data?: { detail?: string } } };
                setError(axiosError.response?.data?.detail || 'Login failed. Please try again.');
            } else {
                setError('Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(145deg, #0d1321 0%, #1d2d44 50%, #3e5c76 100%)',
                p: 2,
            }}
        >
            <Card
                elevation={0}
                sx={{
                    width: '100%',
                    maxWidth: 380,
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                }}
            >
                <CardContent sx={{ p: 4, '&:last-child': { pb: 4 } }}>
                    {/* Logo & Title Section */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Box
                            component="img"
                            src="/goftus.png"
                            alt="Goftus Logo"
                            sx={{
                                width: 72,
                                height: 72,
                                objectFit: 'contain',
                                mx: 'auto',
                                mb: 1.5,
                            }}
                        />
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 700,
                                color: '#1d2d44',
                                letterSpacing: '0.5px',
                                lineHeight: 1.2,
                            }}
                        >
                            GOFTUS
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                fontWeight: 500,
                                color: '#748cab',
                                letterSpacing: '1px',
                                textTransform: 'uppercase',
                                fontSize: '0.7rem',
                            }}
                        >
                            Task Management
                        </Typography>
                    </Box>

                    {error && (
                        <Alert
                            severity="error"
                            sx={{
                                mb: 2,
                                borderRadius: 2,
                                py: 0.5,
                                '& .MuiAlert-message': { fontSize: '0.85rem' }
                            }}
                        >
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@company.com"
                            required
                            size="small"
                            sx={{
                                mb: 2,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    backgroundColor: '#f8f9fa',
                                    '&:hover': { backgroundColor: '#f1f3f4' },
                                    '&.Mui-focused': { backgroundColor: '#fff' },
                                }
                            }}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <EmailIcon sx={{ color: '#748cab', fontSize: 18 }} />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />

                        <TextField
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            size="small"
                            sx={{
                                mb: 2.5,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    backgroundColor: '#f8f9fa',
                                    '&:hover': { backgroundColor: '#f1f3f4' },
                                    '&.Mui-focused': { backgroundColor: '#fff' },
                                }
                            }}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <LockIcon sx={{ color: '#748cab', fontSize: 18 }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                                size="small"
                                                sx={{ color: '#748cab' }}
                                            >
                                                {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={loading}
                            sx={{
                                py: 1.25,
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                borderRadius: 2,
                                textTransform: 'none',
                                background: 'linear-gradient(135deg, #1d2d44 0%, #3e5c76 100%)',
                                boxShadow: '0 4px 14px rgba(29, 45, 68, 0.4)',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #3e5c76 0%, #1d2d44 100%)',
                                    boxShadow: '0 6px 20px rgba(29, 45, 68, 0.5)',
                                    transform: 'translateY(-1px)',
                                },
                                '&:active': {
                                    transform: 'translateY(0)',
                                },
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={22} sx={{ color: '#fff' }} />
                            ) : (
                                'Sign In'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Login;
