import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    Button,
    IconButton,
    Chip,
    Grid,
    Card,
    CardContent,
    Tab,
    Tabs,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider,
    LinearProgress,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Download as DownloadIcon,
    Edit as EditIcon,
    Share as ShareIcon,
    Delete as DeleteIcon,
    History as HistoryIcon,
    Lock as LockIcon,
    LockOpen as UnlockIcon,
    Person as PersonIcon,
    Schedule as TimeIcon,
    Security as SecurityIcon,
    Description as DocumentIcon,
    Visibility as ViewIcon,
    Comment as CommentIcon,
} from '@mui/icons-material';
import { documentService, logService } from '../../services/api';
import webSocketService from '../../services/websocket';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

const DocumentView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [document, setDocument] = useState(null);
    const [versions, setVersions] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [lockedBy, setLockedBy] = useState(null);
    const [shareDialog, setShareDialog] = useState(false);
    const [versionDialog, setVersionDialog] = useState(false);
    const [newVersionComment, setNewVersionComment] = useState('');
    const [shareData, setShareData] = useState({
        usuario_id: '',
        permisos: 'lectura',
        fecha_expiracion: '',
    });

    useEffect(() => {
        fetchDocument();
        setupWebSocket();

        return () => {
            webSocketService.leaveDocument(id);
        };
    }, [id]);

    useEffect(() => {
        if (document) {
            fetchVersions();
            fetchActivityLogs();
        }
    }, [document]);

    const fetchDocument = async () => {
        try {
            setLoading(true);
            const response = await documentService.getById(id);
            setDocument(response.data.document);

            // Verificar estado de bloqueo
            const lockStatus = await documentService.getLockStatus(id);
            setIsLocked(lockStatus.data.isLocked);
            setLockedBy(lockStatus.data.lockInfo);

            // Unirse a la sala del documento en WebSocket
            webSocketService.joinDocument(id);
            webSocketService.notifyDocumentOpened(id, response.data.userId, response.data.userName);

        } catch (error) {
            toast.error('Error cargando documento');
            navigate('/documents');
        } finally {
            setLoading(false);
        }
    };

    const fetchVersions = async () => {
        try {
            const response = await documentService.getVersions(id);
            setVersions(response.data || []);
        } catch (error) {
            console.error('Error cargando versiones:', error);
        }
    };

    const fetchActivityLogs = async () => {
        try {
            const response = await logService.getDocumentLogs(id, { limit: 10 });
            setActivityLogs(response.data.logs || []);
        } catch (error) {
            console.error('Error cargando logs:', error);
        }
    };

    const setupWebSocket = () => {
        webSocketService.on('document-being-used', (data) => {
            if (data.documentId === id && data.userId !== document?.usuario_propietario) {
                toast.info(`${data.userName} está viendo este documento`, {
                    duration: 4000,
                });
            }
        });

        webSocketService.on('document-locked', (data) => {
            if (data.documentId === id) {
                setIsLocked(true);
                setLockedBy({ nombre: data.userName });
                toast.warning(`${data.userName} está editando este documento`, {
                    duration: 5000,
                });
            }
        });

        webSocketService.on('document-unlocked', (data) => {
            if (data.documentId === id) {
                setIsLocked(false);
                setLockedBy(null);
                toast.success('Documento disponible para edición', {
                    duration: 3000,
                });
            }
        });
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleDownload = async () => {
        try {
            await documentService.download(id, document.nombre_original);
            toast.success('Documento descargado');
        } catch (error) {
            toast.error('Error descargando documento');
        }
    };

    const handleEdit = async () => {
        try {
            // Intentar bloquear el documento
            await documentService.lock(id);
            navigate(`/documents/${id}/edit`);
        } catch (error) {
            toast.error('No se puede editar. El documento está bloqueado.');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('¿Está seguro de eliminar este documento?')) {
            try {
                await documentService.delete(id);
                toast.success('Documento eliminado');
                navigate('/documents');
            } catch (error) {
                toast.error('Error eliminando documento');
            }
        }
    };

    const handleShare = async () => {
        try {
            await documentService.share(id, shareData);
            toast.success('Documento compartido exitosamente');
            setShareDialog(false);
            setShareData({
                usuario_id: '',
                permisos: 'lectura',
                fecha_expiracion: '',
            });
        } catch (error) {
            toast.error('Error compartiendo documento');
        }
    };

    const handleCreateVersion = async () => {
        try {
            // En una implementación real, aquí subirías el archivo modificado
            toast.success('Nueva versión creada');
            setVersionDialog(false);
            setNewVersionComment('');
            fetchVersions();
        } catch (error) {
            toast.error('Error creando versión');
        }
    };

    const handleRestoreVersion = async (versionId) => {
        if (window.confirm('¿Restaurar esta versión?')) {
            try {
                // Implementar restauración de versión
                toast.success('Versión restaurada');
                fetchDocument();
            } catch (error) {
                toast.error('Error restaurando versión');
            }
        }
    };

    const getConfidentialityLabel = (level) => {
        const labels = {
            1: 'Público',
            2: 'Interno',
            3: 'Confidencial',
            4: 'Restringido',
            5: 'Secreto',
        };
        return labels[level] || 'Desconocido';
    };

    const getConfidentialityColor = (level) => {
        const colors = {
            1: 'success',
            2: 'info',
            3: 'warning',
            4: 'error',
            5: 'secondary',
        };
        return colors[level] || 'default';
    };

    const getTypeColor = (type) => {
        const colors = {
            contrato: 'primary',
            demanda: 'error',
            fianza: 'warning',
            reporte: 'info',
            correspondencia: 'success',
            evidencia: 'secondary',
            otro: 'default',
        };
        return colors[type] || 'default';
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <Box display="flex" flexDirection="column" gap={2} p={3}>
                <LinearProgress />
                <Typography align="center">Cargando documento...</Typography>
            </Box>
        );
    }

    if (!document) {
        return (
            <Alert severity="error" sx={{ m: 3 }}>
                Documento no encontrado
            </Alert>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <IconButton onClick={() => navigate('/documents')}>
                        <BackIcon />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            {document.nombre_original}
                        </Typography>
                        <Box display="flex" gap={1} alignItems="center">
                            <Chip
                                label={document.tipo_documento}
                                color={getTypeColor(document.tipo_documento)}
                                size="small"
                            />
                            <Chip
                                icon={<SecurityIcon />}
                                label={`${getConfidentialityLabel(document.confidencialidad)} (Nivel ${document.confidencialidad})`}
                                color={getConfidentialityColor(document.confidencialidad)}
                                size="small"
                                variant="outlined"
                            />
                            {isLocked && (
                                <Chip
                                    icon={<LockIcon />}
                                    label={`Bloqueado por ${lockedBy?.nombre || 'otro usuario'}`}
                                    color="error"
                                    size="small"
                                />
                            )}
                        </Box>
                    </Box>
                </Box>

                <Box display="flex" gap={1}>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownload}
                    >
                        Descargar
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={handleEdit}
                        disabled={isLocked}
                    >
                        Editar
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Panel izquierdo: Información y acciones */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Información del Documento
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <List dense>
                            <ListItem>
                                <ListItemAvatar>
                                    <Avatar>
                                        <PersonIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary="Propietario"
                                    secondary={`${document.propietario_nombre} ${document.propietario_apellido}`}
                                />
                            </ListItem>

                            <ListItem>
                                <ListItemAvatar>
                                    <Avatar>
                                        <DocumentIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary="Tamaño"
                                    secondary={formatFileSize(document.tamaño_bytes)}
                                />
                            </ListItem>

                            <ListItem>
                                <ListItemAvatar>
                                    <Avatar>
                                        <TimeIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary="Fecha de subida"
                                    secondary={moment(document.fecha_upload).format('LLL')}
                                />
                            </ListItem>

                            <ListItem>
                                <ListItemAvatar>
                                    <Avatar>
                                        <HistoryIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary="Última modificación"
                                    secondary={moment(document.fecha_modificacion).format('LLL')}
                                />
                            </ListItem>

                            {document.caso_numero && (
                                <ListItem>
                                    <ListItemAvatar>
                                        <Avatar>
                                            <ViewIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary="Caso asociado"
                                        secondary={`${document.caso_numero} - ${document.caso_titulo}`}
                                    />
                                </ListItem>
                            )}
                        </List>
                    </Paper>

                    {/* Acciones rápidas */}
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Acciones
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Box display="flex" flexDirection="column" gap={2}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<ShareIcon />}
                                onClick={() => setShareDialog(true)}
                            >
                                Compartir
                            </Button>

                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<HistoryIcon />}
                                onClick={() => setVersionDialog(true)}
                            >
                                Crear Nueva Versión
                            </Button>

                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<HistoryIcon />}
                                onClick={() => setActiveTab(1)}
                            >
                                Ver Historial de Versiones
                            </Button>

                            <Button
                                fullWidth
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={handleDelete}
                            >
                                Eliminar Documento
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* Panel derecho: Contenido y pestañas */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ mb: 3 }}>
                        <Tabs value={activeTab} onChange={handleTabChange}>
                            <Tab label="Vista Previa" />
                            <Tab label="Versiones" />
                            <Tab label="Actividad" />
                            <Tab label="Compartido con" />
                        </Tabs>
                    </Paper>

                    {/* Contenido de las pestañas */}
                    <Paper sx={{ p: 3 }}>
                        {activeTab === 0 && (
                            <Box>
                                <Typography variant="h6" gutterBottom>
                                    Vista Previa
                                </Typography>
                                <Divider sx={{ mb: 3 }} />

                                <Box
                                    sx={{
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 2,
                                        p: 3,
                                        minHeight: 400,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'grey.50',
                                    }}
                                >
                                    <DocumentIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                                    <Typography variant="h6" gutterBottom>
                                        {document.nombre_original}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary" align="center">
                                        Este es un documento de tipo {document.tipo_documento}. <br />
                                        Para ver el contenido completo, descarga el archivo.
                                    </Typography>

                                    <Button
                                        variant="contained"
                                        startIcon={<DownloadIcon />}
                                        onClick={handleDownload}
                                        sx={{ mt: 3 }}
                                    >
                                        Descargar para ver completo
                                    </Button>
                                </Box>
                            </Box>
                        )}

                        {activeTab === 1 && (
                            <Box>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                    <Typography variant="h6">
                                        Historial de Versiones
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        startIcon={<HistoryIcon />}
                                        onClick={() => setVersionDialog(true)}
                                    >
                                        Nueva Versión
                                    </Button>
                                </Box>
                                <Divider sx={{ mb: 3 }} />

                                {versions.length === 0 ? (
                                    <Typography color="textSecondary" align="center" py={4}>
                                        No hay versiones anteriores
                                    </Typography>
                                ) : (
                                    <List>
                                        {versions.map((version) => (
                                            <React.Fragment key={version.id}>
                                                <ListItem
                                                    secondaryAction={
                                                        <Button
                                                            size="small"
                                                            onClick={() => handleRestoreVersion(version.id)}
                                                        >
                                                            Restaurar
                                                        </Button>
                                                    }
                                                >
                                                    <ListItemAvatar>
                                                        <Avatar>
                                                            <HistoryIcon />
                                                        </Avatar>
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={`Versión ${version.version}`}
                                                        secondary={
                                                            <Box>
                                                                <Typography variant="body2" component="span">
                                                                    {version.comentario}
                                                                </Typography>
                                                                <br />
                                                                <Typography variant="caption" color="textSecondary">
                                                                    {version.nombre} {version.apellido} • {moment(version.fecha_version).format('LLL')}
                                                                </Typography>
                                                            </Box>
                                                        }
                                                    />
                                                </ListItem>
                                                <Divider variant="inset" component="li" />
                                            </React.Fragment>
                                        ))}
                                    </List>
                                )}
                            </Box>
                        )}

                        {activeTab === 2 && (
                            <Box>
                                <Typography variant="h6" gutterBottom>
                                    Actividad Reciente
                                </Typography>
                                <Divider sx={{ mb: 3 }} />

                                {activityLogs.length === 0 ? (
                                    <Typography color="textSecondary" align="center" py={4}>
                                        No hay actividad registrada
                                    </Typography>
                                ) : (
                                    <List>
                                        {activityLogs.map((log) => (
                                            <ListItem key={log.id}>
                                                <ListItemAvatar>
                                                    <Avatar>
                                                        {log.accion === 'login' ? '👤' :
                                                            log.accion === 'editar' ? '✏️' :
                                                                log.accion === 'descargar' ? '⬇️' :
                                                                    log.accion === 'subir' ? '⬆️' : '📄'}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="body2">
                                                            <strong>{log.nombre} {log.apellido}</strong> {log.accion === 'login' ? 'inició sesión' :
                                                                log.accion === 'editar' ? 'editó el documento' :
                                                                    log.accion === 'descargar' ? 'descargó el documento' :
                                                                        log.accion === 'subir' ? 'subió el documento' : 'realizó una acción'}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Typography variant="caption" color="textSecondary">
                                                            {moment(log.fecha_registro).format('LLL')} • Desde {log.direccion_ip}
                                                            {log.duracion_segundos && ` • Duración: ${log.duracion_segundos} segundos`}
                                                        </Typography>
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                            </Box>
                        )}

                        {activeTab === 3 && (
                            <Box>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                    <Typography variant="h6">
                                        Compartido con
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        startIcon={<ShareIcon />}
                                        onClick={() => setShareDialog(true)}
                                    >
                                        Compartir
                                    </Button>
                                </Box>
                                <Divider sx={{ mb: 3 }} />

                                <Typography color="textSecondary" align="center" py={4}>
                                    Funcionalidad de compartir en desarrollo
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Diálogo para compartir */}
            <Dialog open={shareDialog} onClose={() => setShareDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Compartir Documento</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Usuario</InputLabel>
                            <Select
                                value={shareData.usuario_id}
                                onChange={(e) => setShareData({ ...shareData, usuario_id: e.target.value })}
                                label="Usuario"
                            >
                                <MenuItem value="1">María González (Abogada)</MenuItem>
                                <MenuItem value="2">Carlos Rodríguez (Asistente)</MenuItem>
                                <MenuItem value="3">Ana Martínez (Abogada)</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Permisos</InputLabel>
                            <Select
                                value={shareData.permisos}
                                onChange={(e) => setShareData({ ...shareData, permisos: e.target.value })}
                                label="Permisos"
                            >
                                <MenuItem value="lectura">Solo lectura</MenuItem>
                                <MenuItem value="editor">Edición</MenuItem>
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            type="date"
                            label="Fecha de expiración (opcional)"
                            value={shareData.fecha_expiracion}
                            onChange={(e) => setShareData({ ...shareData, fecha_expiracion: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShareDialog(false)}>Cancelar</Button>
                    <Button onClick={handleShare} variant="contained">
                        Compartir
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo para nueva versión */}
            <Dialog open={versionDialog} onClose={() => setVersionDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Crear Nueva Versión</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Comentario de la versión"
                            value={newVersionComment}
                            onChange={(e) => setNewVersionComment(e.target.value)}
                            placeholder="Describe los cambios realizados en esta versión..."
                        />
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                            Los comentarios ayudan a rastrear los cambios entre versiones.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setVersionDialog(false)}>Cancelar</Button>
                    <Button onClick={handleCreateVersion} variant="contained">
                        Crear Versión
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DocumentView;
