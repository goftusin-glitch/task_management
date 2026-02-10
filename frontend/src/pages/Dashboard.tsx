import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { getDashboardStats, type DashboardStats } from '../api/stats';
import BusinessIcon from '@mui/icons-material/Business';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import PeopleIcon from '@mui/icons-material/People';
import { useAuth } from '../context/AuthContext';



const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <Paper sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', flex: 1, minWidth: 200 }}>
        <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {value}
            </Typography>
        </Box>
        <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `${color}15`, color: color }}>
            {icon}
        </Box>
    </Paper>
);

const Dashboard: React.FC = () => {
    const { isAdmin } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!stats) return null;

    return (
        <Box>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>Dashboard</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <StatCard
                    title="Follow Ups"
                    value={stats.follow_ups_count}
                    icon={<BookmarkIcon fontSize="large" />}
                    color="#e91e63"
                />
                <StatCard
                    title="Total Clients"
                    value={stats.clients_count}
                    icon={<BusinessIcon fontSize="large" />}
                    color="#2196f3"
                />
                <StatCard
                    title="Pending Clients"
                    value={stats.clients_pending_count}
                    icon={<TrendingUpIcon fontSize="large" />}
                    color="#ff9800"
                />

                {isAdmin && (
                    <StatCard
                        title="Total Users"
                        value={stats.users_count || 0}
                        icon={<PeopleIcon fontSize="large" />}
                        color="#4caf50"
                    />
                )}

                <StatCard
                    title="Total Tasks"
                    value={stats.tasks_count}
                    icon={<AssignmentIcon fontSize="large" />}
                    color="#673ab7"
                />
                <StatCard
                    title="Pending Tasks"
                    value={stats.tasks_pending_count}
                    icon={<AssignmentLateIcon fontSize="large" />}
                    color="#f44336"
                />
            </Box>
        </Box>
    );
};

export default Dashboard;
