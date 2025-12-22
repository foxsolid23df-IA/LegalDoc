import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { documentService, logService } from '../../services/api';
import {
    Grid,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
    CardHeader,
    Avatar,
    LinearProgress,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemAvatar,
    Button,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Folder as FolderIcon,
    Gavel as CasesIcon,
    People as PeopleIcon,
    Timeline as TimelineIcon,
    Description as DocumentIcon,
    History as HistoryIcon,
    Warning as WarningIcon,
    CheckCircle as CheckIcon,
    AccessTime as TimeIcon,
    Lock as LockIcon,
    Download as DownloadIcon,
    Add as AddIcon,
    ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalDocuments: 0,
        totalCases: 0,
        activeUsers: 0,
        storageUsed: 0,
    });
    const [recentDocuments, setRecentDocuments] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Obtener documentos recientes
            const documentsRes = await documentService.getAll({ limit: 5 });
            setRecentDocuments(documentsRes.data || []);

            // Obtener actividad reciente
            const activityRes = await logService.getRecent(10);
            setRecentActivity(activityRes.data || []);

            // Estadísticas (en una implementación real, sería un endpoint específico)
            setStats({
                totalDocuments: documentsRes.data?.length || 0,
                totalCases: 12, // Mock
                activeUsers: 8, // Mock
                storageUsed: 45, // Porcentaje
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon, color, subtitle }) => (
        <Card>
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            {value}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="textSecondary">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main` }}>
                        {icon}
                    </Avatar>
                </Box>
            </CardContent>
        </Card>
    );

    const DocumentCard = ({ document }) => (
        <Card variant="outlined" sx={{ mb: 1 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: 'primary.light', width: 40, height: 40 }}>
                            <DocumentIcon />
                        </Avatar>
                        <Box>
                            <Typography variant="body2" fontWeight="medium">
                                {document.nombre_original}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {document.tipo_documento} • {new Date(document.fecha_upload).toLocaleDateString()}
                            </Typography>
                        </Box>
                    </Box>
                    <Box>
                        {document.bloqueado_por ? (
                            <Chip size="small" icon={<LockIcon />} label="Bloqueado" color="error" />
                        ) : (
                            <Chip size="small" icon={<CheckIcon />} label="Disponible" color="success" />
                        )}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    const ActivityItem = ({ activity }) => (
        <ListItem sx={{ px: 0 }}>
            <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'action.hover', width: 32, height: 32 }}>
                    <HistoryIcon fontSize="small" />
                </Avatar>
            </ListItemAvatar>
            <ListItemText
                primary={
                    <Typography variant="body2">
                        <strong>{activity.nombre} {activity.apellido}</strong> {getActivityDescription(activity)}
                    </Typography>
                }
                secondary={
                    <Typography variant="caption" color="textSecondary">
                        {new Date(activity.fecha_registro).toLocaleString()}
                    </Typography>
                }
            />
        </ListItem>
    );

    const getActivityDescription = (activity) => {
        switch (activity.accion) {
            case 'login':
                return 'inició sesión';
            case 'subir':
                return 'subió un documento';
            case 'editar':
                return 'editó un documento';
            case 'descargar':
                return 'descargó un documento';
            default:
                return 'realizó una acción';
        }
    };

    const QuickActions = () => (
        <Card>
            <CardHeader title="Acciones Rápidas" />
            <CardContent>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/documents/upload')}
                        >
                            Subir Documento
                        </Button>
                    </Grid>
                    <Grid item xs={6}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<FolderIcon />}
                            onClick={() => navigate('/documents')}
                        >
                            Ver Documentos
                        </Button>
                    </Grid>
                    <Grid item xs={6}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<CasesIcon />}
                            onClick={() => navigate('/cases')}
                        >
                            Gestión de Casos
                        </Button>
                    </Grid>
                    <Grid item xs={6}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<PeopleIcon />}
                            onClick={() => navigate('/users')}
                            disabled={user?.rol !== 'admin'}
                        >
                            Usuarios
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header del Dashboard */}
            <Box mb={4}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Bienvenido, {user?.nombre}!
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    Aquí tienes un resumen de la actividad del sistema
                </Typography>
            </Box>

            {/* Estadísticas */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Documentos"
                        value={stats.totalDocuments}
                        icon={<FolderIcon />}
                        color="primary"
                        subtitle="Total en el sistema"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Casos Activos"
                        value={stats.totalCases}
                        icon={<CasesIcon />}
                        color="secondary"
                        subtitle="En proceso"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Usuarios Activos"
                        value={stats.activeUsers}
                        icon={<PeopleIcon />}
                        color="success"
                        subtitle="En línea ahora"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Almacenamiento"
                        value={`${stats.storageUsed}%`}
                        icon={<TimelineIcon />}
                        color="warning"
                        subtitle="Utilizado"
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Documentos Recientes */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader
                            title="Documentos Recientes"
                            action={
                                <Button
                                    size="small"
                                    endIcon={<ArrowIcon />}
                                    onClick={() => navigate('/documents')}
                                >
                                    Ver todos
                                </Button>
                            }
                        />
                        <CardContent>
                            {recentDocuments.length > 0 ? (
                                recentDocuments.map((doc) => (
                                    <DocumentCard key={doc.id} document={doc} />
                                ))
                            ) : (
                                <Typography variant="body2" color="textSecondary" align="center" py={2}>
                                    No hay documentos recientes
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Actividad Reciente */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader
                            title="Actividad Reciente"
                            action={
                                <Button
                                    size="small"
                                    endIcon={<ArrowIcon />}
                                    onClick={() => navigate('/logs')}
                                >
                                    Ver todos
                                </Button>
                            }
                        />
                        <CardContent sx={{ p: 0 }}>
                            <List>
                                {recentActivity.length > 0 ? (
                                    recentActivity.slice(0, 5).map((activity) => (
                                        <ActivityItem key={activity.id} activity={activity} />
                                    ))
                                ) : (
                                    <ListItem>
                                        <ListItemText
                                            primary={
                                                <Typography variant="body2" color="textSecondary" align="center">
                                                    No hay actividad reciente
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                )}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Acciones Rápidas */}
                <Grid item xs={12}>
                    <QuickActions />
                </Grid>
            </Grid>

            {/* Mensaje de bienvenida basado en el rol */}
            <Paper sx={{ p: 3, mt: 4, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            {user?.rol === 'admin' && 'Administración del Sistema'}
                            {user?.rol === 'abogado' && 'Gestión de Documentos Legales'}
                            {user?.rol === 'asistente' && 'Apoyo Documental'}
                        </Typography>
                        <Typography variant="body2">
                            {user?.rol === 'admin' &&
                                'Tienes acceso completo al sistema. Puedes gestionar usuarios, revisar logs y configurar el sistema.'}
                            {user?.rol === 'abogado' &&
                                'Gestiona tus casos, revisa documentos y colabora con tu equipo de manera segura.'}
                            {user?.rol === 'asistente' &&
                                'Ayuda en la organización de documentos y el seguimiento de casos.'}
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        color="inherit"
                        onClick={() => navigate('/profile')}
                    >
                        Ver mi perfil
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default Dashboard;
