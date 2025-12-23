// frontend/src/modules/dashboard/DashboardFusionado.jsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Typography,
    Card,
    CardContent,
    LinearProgress
} from '@mui/material';
import {
    Gavel as CasoIcon,
    Description as DocumentIcon,
    AttachMoney as MoneyIcon,
    Timeline as ChartIcon
} from '@mui/icons-material';

// Componentes
import CasosActivosWidget from './widgets/CasosActivosWidget';
import FinanzasResumenWidget from './widgets/FinanzasResumenWidget';
import DocumentosRecientesWidget from './widgets/DocumentosRecientesWidget';
import ActividadEquipoWidget from './widgets/ActividadEquipoWidget';
import MetricasRentabilidadWidget from './widgets/MetricasRentabilidadWidget';

// Servicios
import { dashboardService } from '../../services/api';

const DashboardFusionado = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarDashboard();
    }, []);

    const cargarDashboard = async () => {
        try {
            setLoading(true);
            const data = await dashboardService.obtenerDatosFusionados();
            setDashboardData(data);
        } catch (error) {
            console.error('Error cargando dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LinearProgress />;
    }

    return (
        <Box p={3}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
                Dashboard Legal-ERP
            </Typography>
            <Typography variant="body2" color="textSecondary" mb={4}>
                Vista unificada de gestión legal y empresarial
            </Typography>

            {/* Métricas principales */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {dashboardData?.metricas?.casos_activos || 0}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Casos Activos
                                    </Typography>
                                </Box>
                                <CasoIcon color="primary" sx={{ fontSize: 40 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="h4" fontWeight="bold" color="success.main">
                                        ${dashboardData?.metricas?.ingresos_mes?.toLocaleString() || '0'}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Ingresos Mes
                                    </Typography>
                                </Box>
                                <MoneyIcon color="success" sx={{ fontSize: 40 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="h4" fontWeight="bold" color="info.main">
                                        {dashboardData?.metricas?.documentos_mes || 0}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Documentos/Mes
                                    </Typography>
                                </Box>
                                <DocumentIcon color="info" sx={{ fontSize: 40 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="h4" fontWeight="bold" color="warning.main">
                                        {dashboardData?.metricas?.roi_promedio || 0}%
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        ROI Promedio
                                    </Typography>
                                </Box>
                                <ChartIcon color="warning" sx={{ fontSize: 40 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Widgets principales */}
            <Grid container spacing={3}>
                <Grid item xs={12} lg={8}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <CasosActivosWidget
                                casos={dashboardData?.casos_activos}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <DocumentosRecientesWidget
                                documentos={dashboardData?.documentos_recientes}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <ActividadEquipoWidget
                                actividad={dashboardData?.actividad_equipo}
                            />
                        </Grid>
                    </Grid>
                </Grid>

                <Grid item xs={12} lg={4}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <FinanzasResumenWidget
                                datos={dashboardData?.finanzas}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <MetricasRentabilidadWidget
                                metricas={dashboardData?.metricas_rentabilidad}
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};

export default DashboardFusionado;
