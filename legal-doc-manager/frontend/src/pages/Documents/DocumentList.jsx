import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    InputAdornment,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Tooltip,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
} from '@mui/material';
import {
    Search as SearchIcon,
    FilterList as FilterIcon,
    Add as AddIcon,
    Visibility as ViewIcon,
    Edit as EditIcon,
    Download as DownloadIcon,
    Share as ShareIcon,
    Delete as DeleteIcon,
    Lock as LockIcon,
    LockOpen as UnlockIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { documentService } from '../../services/api';
import { toast } from 'react-hot-toast';

const DocumentList = () => {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        tipo_documento: '',
        caso_id: '',
        confidencialidad: '',
    });
    const [deleteDialog, setDeleteDialog] = useState({ open: false, documentId: null });

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

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await documentService.getAll({
                q: search,
                tipo_documento: filters.tipo_documento,
                caso_id: filters.caso_id,
                confidencialidad_max: filters.confidencialidad,
            });
            setDocuments(response.data || []);
        } catch (error) {
            toast.error('Error cargando documentos');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    const handleFilterChange = (name, value) => {
        setFilters({
            ...filters,
            [name]: value,
        });
    };

    const handleApplyFilters = () => {
        fetchDocuments();
    };

    const handleClearFilters = () => {
        setSearch('');
        setFilters({
            tipo_documento: '',
            caso_id: '',
            confidencialidad: '',
        });
        fetchDocuments();
    };

    const handleViewDocument = async (id) => {
        try {
            // Primero obtener el estado de bloqueo
            const lockStatus = await documentService.getLockStatus(id);

            if (lockStatus.data.isLocked) {
                toast.error(`Documento bloqueado por ${lockStatus.data.lockInfo.nombre}`);
                return;
            }

            navigate(`/documents/${id}`);
        } catch (error) {
            toast.error('Error al acceder al documento');
        }
    };

    const handleEditDocument = async (id) => {
        try {
            // Bloquear documento antes de editar
            await documentService.lock(id);
            navigate(`/documents/${id}/edit`);
        } catch (error) {
            toast.error('No se pudo bloquear el documento para edición');
        }
    };

    const handleDownload = async (id, filename) => {
        try {
            const blob = await documentService.download(id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Documento descargado');
        } catch (error) {
            toast.error('Error descargando documento');
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteDialog({ open: true, documentId: id });
    };

    const handleDeleteConfirm = async () => {
        try {
            await documentService.delete(deleteDialog.documentId);
            toast.success('Documento eliminado');
            fetchDocuments();
            setDeleteDialog({ open: false, documentId: null });
        } catch (error) {
            toast.error('Error eliminando documento');
        }
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

    return (
        <Box>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">
                        Documentos
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Gestión de documentos legales
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/documents/upload')}
                >
                    Subir Documento
                </Button>
            </Box>

            {/* Filtros */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
                    <TextField
                        placeholder="Buscar documentos..."
                        value={search}
                        onChange={handleSearch}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ flex: 1, minWidth: 200 }}
                    />

                    <FormControl sx={{ minWidth: 150 }}>
                        <InputLabel>Tipo</InputLabel>
                        <Select
                            value={filters.tipo_documento}
                            onChange={(e) => handleFilterChange('tipo_documento', e.target.value)}
                            label="Tipo"
                        >
                            <MenuItem value="">Todos</MenuItem>
                            {documentTypes.map(type => (
                                <MenuItem key={type.value} value={type.value}>
                                    {type.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 150 }}>
                        <InputLabel>Confidencialidad</InputLabel>
                        <Select
                            value={filters.confidencialidad}
                            onChange={(e) => handleFilterChange('confidencialidad', e.target.value)}
                            label="Confidencialidad"
                        >
                            <MenuItem value="">Todos</MenuItem>
                            {confidentialityLevels.map(level => (
                                <MenuItem key={level.value} value={level.value}>
                                    {level.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box display="flex" gap={1}>
                        <Button
                            variant="contained"
                            startIcon={<FilterIcon />}
                            onClick={handleApplyFilters}
                        >
                            Aplicar
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={handleClearFilters}
                        >
                            Limpiar
                        </Button>
                        <IconButton onClick={fetchDocuments}>
                            <RefreshIcon />
                        </IconButton>
                    </Box>
                </Box>
            </Paper>

            {/* Tabla de documentos */}
            <Paper>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress />
                    </Box>
                ) : documents.length === 0 ? (
                    <Box p={4} textAlign="center">
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                            No se encontraron documentos
                        </Typography>
                        <Typography variant="body2" color="textSecondary" mb={3}>
                            {search || Object.values(filters).some(f => f)
                                ? 'Intenta con otros filtros de búsqueda'
                                : 'Sube tu primer documento haciendo clic en el botón "Subir Documento"'}
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/documents/upload')}
                        >
                            Subir Documento
                        </Button>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Nombre</TableCell>
                                    <TableCell>Tipo</TableCell>
                                    <TableCell>Confidencialidad</TableCell>
                                    <TableCell>Propietario</TableCell>
                                    <TableCell>Tamaño</TableCell>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell align="center">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {documents.map((doc) => (
                                    <TableRow key={doc.id} hover>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {doc.nombre_original}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {doc.caso_numero ? `Caso: ${doc.caso_numero}` : 'Sin caso asignado'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={doc.tipo_documento}
                                                color={getTypeColor(doc.tipo_documento)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={`Nivel ${doc.confidencialidad}`}
                                                color={getConfidentialityColor(doc.confidencialidad)}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {doc.propietario_nombre} {doc.propietario_apellido}
                                        </TableCell>
                                        <TableCell>
                                            {formatFileSize(doc.tamaño_bytes)}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(doc.fecha_upload).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {doc.bloqueado_por ? (
                                                <Chip
                                                    icon={<LockIcon />}
                                                    label="Bloqueado"
                                                    color="error"
                                                    size="small"
                                                />
                                            ) : (
                                                <Chip
                                                    icon={<UnlockIcon />}
                                                    label="Disponible"
                                                    color="success"
                                                    size="small"
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box display="flex" gap={1} justifyContent="center">
                                                <Tooltip title="Ver">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleViewDocument(doc.id)}
                                                    >
                                                        <ViewIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Editar">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleEditDocument(doc.id)}
                                                        disabled={!!doc.bloqueado_por}
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Descargar">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDownload(doc.id, doc.nombre_original)}
                                                    >
                                                        <DownloadIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Compartir">
                                                    <IconButton size="small">
                                                        <ShareIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Eliminar">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDeleteClick(doc.id)}
                                                        color="error"
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Diálogo de confirmación para eliminar */}
            <Dialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, documentId: null })}
            >
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        ¿Está seguro de eliminar este documento? Esta acción no se puede deshacer.
                    </Alert>
                    <Typography variant="body2">
                        El documento será eliminado permanentemente del sistema, incluyendo todas sus versiones.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, documentId: null })}>
                        Cancelar
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DocumentList;
