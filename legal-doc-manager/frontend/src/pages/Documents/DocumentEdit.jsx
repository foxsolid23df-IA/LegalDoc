import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Card,
    CardContent,
    Alert,
    LinearProgress,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
    Lock as LockIcon,
    History as HistoryIcon,
    Download as DownloadIcon,
    Upload as UploadIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { documentService } from '../../services/api';
import webSocketService from '../../services/websocket';
import { toast } from 'react-hot-toast';

const DocumentEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [content, setContent] = useState('');
    const [formData, setFormData] = useState({
        nombre_original: '',
        tipo_documento: '',
        confidencialidad: 3,
        caso_id: '',
    });
    const [isLocked, setIsLocked] = useState(false);
    const [lockedBy, setLockedBy] = useState(null);
    const [sessionId, setSessionId] = useState(null);
    const [autoSaveTimer, setAutoSaveTimer] = useState(null);
    const [lastSaved, setLastSaved] = useState(null);
    const [changesMade, setChangesMade] = useState(false);
    const [confirmExit, setConfirmExit] = useState(false);
    const editorRef = useRef(null);

    // Configuración del editor Quill
    const modules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ indent: '-1' }, { indent: '+1' }],
            [{ align: [] }],
            ['link', 'image'],
            ['clean'],
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet', 'indent',
        'align',
        'link', 'image',
    ];

    useEffect(() => {
        fetchDocument();

        // Configurar WebSocket para notificaciones
        webSocketService.on('document-locked', handleDocumentLocked);
        webSocketService.on('document-unlocked', handleDocumentUnlocked);

        // Configurar beforeunload para prevenir cierre accidental
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            // Limpiar al desmontar
            cleanup();
            window.removeEventListener('beforeunload', handleBeforeUnload);
            webSocketService.off('document-locked', handleDocumentLocked);
            webSocketService.off('document-unlocked', handleDocumentUnlocked);
        };
    }, []);

    useEffect(() => {
        if (document && !isLocked) {
            lockDocument();
        }
    }, [document]);

    useEffect(() => {
        // Auto-save cada 30 segundos si hay cambios
        if (changesMade && !saving) {
            if (autoSaveTimer) clearTimeout(autoSaveTimer);

            const timer = setTimeout(() => {
                autoSave();
            }, 30000);

            setAutoSaveTimer(timer);
        }

        return () => {
            if (autoSaveTimer) clearTimeout(autoSaveTimer);
        };
    }, [content, formData, changesMade]);

    const fetchDocument = async () => {
        try {
            setLoading(true);
            const response = await documentService.getById(id);
            const doc = response.data.document;

            setDocument(doc);
            setFormData({
                nombre_original: doc.nombre_original,
                tipo_documento: doc.tipo_documento,
                confidencialidad: doc.confidencialidad,
                caso_id: doc.caso_id || '',
            });

            // En una implementación real, cargarías el contenido del documento
            setContent(`<h1>${doc.nombre_original}</h1><p>Contenido del documento...</p>`);

            setSessionId(response.data.workSessionId);

        } catch (error) {
            toast.error('Error cargando documento para edición');
            navigate(`/documents/${id}`);
        } finally {
            setLoading(false);
        }
    };

    const lockDocument = async () => {
        try {
            const response = await documentService.lock(id);
            setSessionId(response.data.sessionId);
            setIsLocked(true);

            // Unirse a la sala del documento
            webSocketService.joinDocument(id);

            toast.success('Documento bloqueado para edición');
        } catch (error) {
            if (error.response?.status === 409) {
                const lockStatus = await documentService.getLockStatus(id);
                setIsLocked(true);
                setLockedBy(lockStatus.data.lockInfo);
                toast.error(`Documento bloqueado por ${lockStatus.data.lockInfo.nombre}`);
                navigate(`/documents/${id}`);
            } else {
                toast.error('Error al bloquear el documento');
                navigate(`/documents/${id}`);
            }
        }
    };

    const handleDocumentLocked = (data) => {
        if (data.documentId === id && data.userId !== document?.usuario_propietario) {
            setIsLocked(true);
            setLockedBy({ nombre: data.userName });
            toast.warning(`${data.userName} tomó el control del documento`, {
                duration: 5000,
            });
        }
    };

    const handleDocumentUnlocked = (data) => {
        if (data.documentId === id) {
            setIsLocked(false);
            setLockedBy(null);
        }
    };

    const handleBeforeUnload = (e) => {
        if (changesMade) {
            e.preventDefault();
            e.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro de querer salir?';
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        setChangesMade(true);
    };

    const handleContentChange = (value) => {
        setContent(value);
        setChangesMade(true);
    };

    const autoSave = async () => {
        if (!changesMade || saving) return;

        try {
            setSaving(true);
            // En una implementación real, aquí guardarías el contenido
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulación

            setLastSaved(new Date());
            setChangesMade(false);
            toast.success('Cambios guardados automáticamente');
        } catch (error) {
            console.error('Error en auto-save:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Actualizar metadatos
            await documentService.update(id, formData);

            // En una implementación real, aquí guardarías el contenido del editor
            // y crearías una nueva versión

            setLastSaved(new Date());
            setChangesMade(false);

            toast.success('Documento guardado exitosamente');

            // Opcional: crear una nueva versión
            // await documentService.createVersion(id, { comentario: 'Edición manual' });

        } catch (error) {
            toast.error('Error guardando documento');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (changesMade) {
            setConfirmExit(true);
        } else {
            cleanupAndExit();
        }
    };

    const cleanupAndExit = async () => {
        try {
            // Liberar bloqueo
            await documentService.unlock(id, {
                workSessionId: sessionId,
                cambios: JSON.stringify({ contentLength: content.length }),
            });

            // Salir de la sala WebSocket
            webSocketService.leaveDocument(id);

            // Notificar cierre
            webSocketService.notifyDocumentClosed(id, document?.usuario_propietario);

        } catch (error) {
            console.error('Error al limpiar:', error);
        } finally {
            navigate(`/documents/${id}`);
        }
    };

    const cleanup = async () => {
        if (isLocked && sessionId) {
            try {
                await documentService.unlock(id, { workSessionId: sessionId });
            } catch (error) {
                console.error('Error al liberar documento:', error);
            }
        }
    };

    const downloadCurrentVersion = () => {
        // Implementar descarga del contenido actual
        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${document.nombre_original}_editado.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const documentTypes = [
        { value: 'contrato', label: 'Contrato' },
        { value: 'demanda', label: 'Demanda' },
        { value: 'fianza', label: 'Fianza' },
        { value: 'reporte', label: 'Reporte' },
        { value: 'correspondencia', label: 'Correspondencia' },
        { value: 'evidencia', label: 'Evidencia' },
        { value: 'otro', label: 'Otro' },
    ];

    const confidentialityLevels = [
        { value: 1, label: 'Nivel 1 - Público' },
        { value: 2, label: 'Nivel 2 - Interno' },
        { value: 3, label: 'Nivel 3 - Confidencial' },
        { value: 4, label: 'Nivel 4 - Restringido' },
        { value: 5, label: 'Nivel 5 - Secreto' },
    ];

    if (loading) {
        return (
            <Box display="flex" flexDirection="column" gap={2} p={3}>
                <LinearProgress />
                <Typography align="center">Cargando editor...</Typography>
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

    if (isLocked && lockedBy && lockedBy.nombre !== document.propietario_nombre) {
        return (
            <Box p={3}>
                <Alert severity="warning" icon={<LockIcon />}>
                    <Typography variant="h6" gutterBottom>
                        Documento en uso
                    </Typography>
                    <Typography>
                        Este documento está siendo editado por <strong>{lockedBy.nombre}</strong>.
                        No puedes editarlo hasta que lo libere.
                    </Typography>
                    <Button
                        variant="outlined"
                        sx={{ mt: 2 }}
                        onClick={() => navigate(`/documents/${id}`)}
                    >
                        Volver a la vista del documento
                    </Button>
                </Alert>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <IconButton onClick={handleCancel}>
                        <BackIcon />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            Editando: {document.nombre_original}
                        </Typography>
                        <Box display="flex" gap={1} alignItems="center">
                            <Chip
                                icon={<LockIcon />}
                                label="Bloqueado para edición"
                                color="success"
                                size="small"
                            />
                            {lastSaved && (
                                <Typography variant="caption" color="textSecondary">
                                    Último guardado: {lastSaved.toLocaleTimeString()}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Box>

                <Box display="flex" gap={1}>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={downloadCurrentVersion}
                    >
                        Descargar
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        disabled={saving || !changesMade}
                    >
                        {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                </Box>
            </Box>

            {/* Barra de estado */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'warning.light' }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                        <WarningIcon color="warning" />
                        <Typography variant="body2">
                            <strong>Modo edición activo</strong> • Este documento está bloqueado para ti
                        </Typography>
                    </Box>
                    <Typography variant="caption">
                        Sesión ID: {sessionId?.substring(0, 8)}...
                    </Typography>
                </Box>
                {saving && <LinearProgress sx={{ mt: 1 }} />}
            </Paper>

            <Grid container spacing={3}>
                {/* Panel de metadatos */}
                <Grid item xs={12} md={3}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Metadatos
                        </Typography>

                        <TextField
                            fullWidth
                            label="Nombre del documento"
                            name="nombre_original"
                            value={formData.nombre_original}
                            onChange={handleInputChange}
                            margin="normal"
                            required
                        />

                        <FormControl fullWidth margin="normal" required>
                            <InputLabel>Tipo de documento</InputLabel>
                            <Select
                                name="tipo_documento"
                                value={formData.tipo_documento}
                                onChange={handleInputChange}
                                label="Tipo de documento"
                            >
                                {documentTypes.map(type => (
                                    <MenuItem key={type.value} value={type.value}>
                                        {type.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth margin="normal" required>
                            <InputLabel>Confidencialidad</InputLabel>
                            <Select
                                name="confidencialidad"
                                value={formData.confidencialidad}
                                onChange={handleInputChange}
                                label="Confidencialidad"
                            >
                                {confidentialityLevels.map(level => (
                                    <MenuItem key={level.value} value={level.value}>
                                        {level.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            label="ID del caso"
                            name="caso_id"
                            value={formData.caso_id}
                            onChange={handleInputChange}
                            margin="normal"
                            placeholder="Ej: LAW-2024-001"
                        />

                        <Alert severity="info" sx={{ mt: 2 }}>
                            <Typography variant="body2">
                                Los cambios se guardan automáticamente cada 30 segundos.
                            </Typography>
                        </Alert>
                    </Paper>

                    {/* Información del documento */}
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2" gutterBottom>
                                Información del documento
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="caption" display="block" color="textSecondary">
                                    Tamaño original: {(document.tamaño_bytes / 1024).toFixed(1)} KB
                                </Typography>
                                <Typography variant="caption" display="block" color="textSecondary">
                                    Versión actual: {document.version_actual}
                                </Typography>
                                <Typography variant="caption" display="block" color="textSecondary">
                                    Propietario: {document.propietario_nombre} {document.propietario_apellido}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Editor principal */}
                <Grid item xs={12} md={9}>
                    <Paper sx={{ p: 2, mb: 2 }}>
                        <ReactQuill
                            ref={editorRef}
                            theme="snow"
                            value={content}
                            onChange={handleContentChange}
                            modules={modules}
                            formats={formats}
                            style={{ height: '500px' }}
                        />
                    </Paper>

                    {/* Contador y estadísticas */}
                    <Paper sx={{ p: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box>
                                <Typography variant="body2">
                                    Caracteres: {content.replace(/<[^>]*>/g, '').length} •
                                    Palabras: {content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length}
                                </Typography>
                            </Box>
                            <Box display="flex" gap={1}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<HistoryIcon />}
                                    onClick={() => navigate(`/documents/${id}`)}
                                >
                                    Ver versiones
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<UploadIcon />}
                                    onClick={() => {
                                        // Implementar subida de archivo para reemplazar contenido
                                    }}
                                >
                                    Reemplazar archivo
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Diálogo de confirmación de salida */}
            <Dialog open={confirmExit} onClose={() => setConfirmExit(false)}>
                <DialogTitle>Cambios sin guardar</DialogTitle>
                <DialogContent>
                    <Typography>
                        Tienes cambios sin guardar en el documento. ¿Estás seguro de que quieres salir?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmExit(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={() => {
                        setConfirmExit(false);
                        cleanupAndExit();
                    }} color="error">
                        Salir sin guardar
                    </Button>
                    <Button onClick={async () => {
                        await handleSave();
                        setConfirmExit(false);
                        setTimeout(() => cleanupAndExit(), 1000);
                    }} variant="contained">
                        Guardar y salir
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DocumentEdit;
