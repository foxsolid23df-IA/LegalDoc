// frontend/src/modules/unidades-casos/UnidadCasoDetalle.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box,
    Grid,
    Paper,
    Tabs,
    Tab,
    Typography,
    Chip,
    CircularProgress,
    Alert
} from '@mui/material';

// Componentes de módulos
import ResumenUnidad from './components/ResumenUnidad';
import DocumentosUnidad from './components/DocumentosUnidad';
import FinanzasUnidad from './components/FinanzasUnidad';
import TareasUnidad from './components/TareasUnidad';
import ReportesUnidad from './components/ReportesUnidad';

// Servicios
import { unidadCasoService } from '../../services/api';

const UnidadCasoDetalle = () => {
    const { id } = useParams();
    const [unidad, setUnidad] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [error, setError] = useState(null);

    useEffect(() => {
        cargarUnidadCaso();
    }, [id]);

    const cargarUnidadCaso = async () => {
        try {
            setLoading(true);
            // Simular ID si no viene (para demo)
            const targetId = id || 1;
            const data = await unidadCasoService.obtenerPorId(targetId);
            setUnidad(data);
        } catch (err) {
            console.error(err);
            setError('Error cargando la unidad caso');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !unidad) {
        return (
            <Alert severity="error" sx={{ m: 3 }}>
                {error || 'Unidad caso no encontrada'}
            </Alert>
        );
    }

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Determinar color según tipo de unidad
    const getTipoColor = (tipo) => {
        const colors = {
            'caso_legal': 'primary',
            'proyecto': 'secondary',
            'contrato': 'success',
            'litigio': 'error'
        };
        return colors[tipo] || 'default';
    };

    return (
        <Box>
            {/* Header */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            {unidad.nombre}
                        </Typography>
                        <Box display="flex" gap={1} alignItems="center" mb={2}>
                            <Chip
                                label={unidad.tipo_unidad ? unidad.tipo_unidad.replace('_', ' ').toUpperCase() : 'N/A'}
                                color={getTipoColor(unidad.tipo_unidad)}
                                size="small"
                            />
                            <Chip
                                label={unidad.estado ? unidad.estado.replace('_', ' ') : 'Desconocido'}
                                color={unidad.estado === 'activo' ? 'success' : 'warning'}
                                size="small"
                                variant="outlined"
                            />
                            <Typography variant="body2" color="textSecondary">
                                Código: {unidad.codigo_unidad}
                            </Typography>
                        </Box>
                        <Typography variant="body1">
                            {unidad.descripcion}
                        </Typography>
                    </Box>

                    {/* Métricas rápidas */}
                    {unidad.metricas && (
                        <Box textAlign="right">
                            <Typography variant="h6" color="primary.main">
                                ${unidad.metricas.balance?.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                Balance financiero
                            </Typography>
                            <Box mt={1}>
                                <Typography variant="body2">
                                    ROI: {unidad.metricas.roi}%
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Retorno sobre inversión
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* Tabs de navegación */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={activeTab} onChange={handleTabChange}>
                    <Tab label="Resumen" />
                    <Tab label="Documentos" />
                    <Tab label="Finanzas" />
                    <Tab label="Tareas" />
                    <Tab label="Reportes" />
                </Tabs>
            </Paper>

            {/* Contenido de tabs */}
            <Grid container spacing={3}>
                {activeTab === 0 && (
                    <Grid item xs={12}>
                        <ResumenUnidad unidad={unidad} />
                    </Grid>
                )}

                {activeTab === 1 && (
                    <Grid item xs={12}>
                        <DocumentosUnidad
                            documentos={unidad.documentos}
                            unidadId={unidad.id}
                            onDocumentoActualizado={cargarUnidadCaso}
                        />
                    </Grid>
                )}

                {activeTab === 2 && (
                    <Grid item xs={12}>
                        <FinanzasUnidad
                            transacciones={unidad.transacciones}
                            metricas={unidad.metricas}
                            unidadId={unidad.id}
                        />
                    </Grid>
                )}

                {activeTab === 3 && (
                    <Grid item xs={12}>
                        <TareasUnidad
                            tareas={unidad.tareas}
                            unidadId={unidad.id}
                            equipo={unidad.equipo}
                        />
                    </Grid>
                )}

                {activeTab === 4 && (
                    <Grid item xs={12}>
                        <ReportesUnidad
                            unidadId={unidad.id}
                            unidadData={unidad}
                        />
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};

export default UnidadCasoDetalle;
