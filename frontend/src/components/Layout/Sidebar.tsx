import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Drawer,
    Box,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Button,
    Chip,
    Avatar,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';

interface SidebarProps {
    drawerWidth: number;
}

const Sidebar: React.FC<SidebarProps> = ({ drawerWidth }) => {
    const { user, isAdmin, hasPageAccess, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/', label: 'Dashboard', access: 'dashboard', adminOnly: false, icon: <DashboardIcon /> },
        { path: '/users', label: 'Users', access: 'users', adminOnly: true, icon: <PeopleIcon /> },
        { path: '/clients', label: 'Clients', access: 'clients', adminOnly: false, icon: <BusinessIcon /> },
        { path: '/follow-ups', label: 'Follow Ups', access: 'follow_ups', adminOnly: false, icon: <BookmarkIcon /> },
        { path: '/tasks', label: 'Tasks', access: 'tasks', adminOnly: true, icon: <AssignmentIcon /> },
        { path: '/expenses', label: 'Expenses', access: 'expenses', adminOnly: false, icon: <ReceiptLongIcon /> },
        { path: '/my-task', label: isAdmin ? 'Assigned Tasks' : 'My Tasks', access: 'my_task', adminOnly: false, icon: <TaskAltIcon /> },
        { path: '/my-progress', label: 'My Progress', access: 'my_progress', adminOnly: false, icon: <TrendingUpIcon /> },
        { path: '/completed-task', label: 'Completed', access: 'completed_task', adminOnly: false, icon: <CheckCircleIcon /> },
        { path: '/projects', label: 'Projects', access: 'projects', adminOnly: false, icon: <FolderIcon /> },
    ];

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
                    color: '#ffffff',
                },
            }}
        >
            <Box sx={{ p: 3, pb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                    component="img"
                    src="/goftus.png"
                    alt="Goftus Logo"
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 1.5,
                        objectFit: 'contain',
                    }}
                />
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', mb: 0, lineHeight: 1.2 }}>
                        GOFTUS
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        GOFTUS Team
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mx: 2 }} />

            <List sx={{ flex: 1, px: 1.5, py: 2 }}>
                {navItems.map((item) => {
                    if (item.adminOnly && !isAdmin) return null;
                    if (!item.adminOnly && !hasPageAccess(item.access)) return null;

                    const isActive = location.pathname === item.path;

                    return (
                        <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                component={NavLink}
                                to={item.path}
                                sx={{
                                    borderRadius: 2,
                                    py: 1.2,
                                    px: 2,
                                    color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                                    backgroundColor: isActive ? 'rgba(233, 69, 96, 0.2)' : 'transparent',
                                    '&:hover': {
                                        backgroundColor: isActive
                                            ? 'rgba(233, 69, 96, 0.25)'
                                            : 'rgba(255,255,255,0.08)',
                                        color: '#fff',
                                    },
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        color: isActive ? '#e94560' : 'rgba(255,255,255,0.5)',
                                        minWidth: 40,
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.label}
                                    primaryTypographyProps={{
                                        fontSize: '0.875rem',
                                        fontWeight: isActive ? 600 : 400,
                                    }}
                                />
                                {isActive && (
                                    <Box
                                        sx={{
                                            width: 4,
                                            height: 20,
                                            borderRadius: 2,
                                            backgroundColor: '#e94560',
                                        }}
                                    />
                                )}
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mx: 2 }} />

            <Box sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                        sx={{
                            width: 36,
                            height: 36,
                            bgcolor: '#e94560',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            mr: 1.5,
                        }}
                    >
                        {user?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            >
                                {user?.name}
                            </Typography>
                            {isAdmin && (
                                <Chip
                                    label="Admin"
                                    size="small"
                                    sx={{
                                        height: 20,
                                        fontSize: '0.625rem',
                                        fontWeight: 700,
                                        bgcolor: '#e94560',
                                        color: '#fff',
                                    }}
                                />
                            )}
                        </Box>
                        <Typography
                            variant="caption"
                            sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                            {user?.email}
                        </Typography>
                    </Box>
                </Box>
                <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                    sx={{
                        color: 'rgba(255,255,255,0.7)',
                        borderColor: 'rgba(255,255,255,0.2)',
                        borderRadius: 2,
                        '&:hover': {
                            borderColor: '#e94560',
                            color: '#e94560',
                            backgroundColor: 'rgba(233, 69, 96, 0.08)',
                        },
                    }}
                >
                    Logout
                </Button>
            </Box>
        </Drawer>
    );
};

export default Sidebar;
