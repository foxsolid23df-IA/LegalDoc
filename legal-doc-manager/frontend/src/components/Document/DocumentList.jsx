import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Chip,
    TextField,
    InputAdornment,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Button,
    Box,
    Typography,
    Tooltip,
    CircularProgress
} from '@mui/material';
import {
    Search as SearchIcon,
    Lock as LockIcon,
    LockOpen as LockOpenIcon,
    Download as DownloadIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    Share as ShareIcon
} from '@mui/icons-material';
import { documentService } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const DocumentList = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterCase, setFilterCase] = useState('');
    const [cases, setCases] = useState([]);
    const navigate = useNavigate();

    const documentTypes = [
        { value: 'contrato', label: 'Contrato' },
        { value: 'demanda', label: 'Demanda' },
        { value: 'fianza', label: 'Fianza' },
        { value: 'reporte', label: 'Reporte' },
        { value: 'correspondencia', label: 'Correspondencia' },
        { value: 'evidencia', label: 'Evidencia' },
        { value: 'otro', label: 'Otro' }
    ];

    useEffect(() => {
        fetchDocuments();
        fetchCases();
    }, []);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await documentService.getAll({
                q: search,
                tipo_documento: filterType,
                caso_id: filterCase
            });
            setDocuments(response.data || []);
        } catch (error) {
            console.error('Error fetching documents:', error);
            if (error.response?.status !== 404) {
                toast.error('Error cargando documentos');
            }
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchCases = async () => {
        // Implementar fetch de casos
        setCases([]); // Temporal
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    const handleTypeFilter = (e) => {
        setFilterType(e.target.value);
    };

    const handleCaseFilter = (e) => {
        setFilterCase(e.target.value);
    };

    const handleViewDocument = (id) => {
        navigate(`/documents/${id}`);
    };

    const handleEditDocument = async (id) => {
        try {
            // Primero bloquear el documento
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

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar este documento?')) {
            try {
                await documentService.delete(id);
                toast.success('Documento eliminado');
                fetchDocuments();
            } catch (error) {
                toast.error('Error eliminando documento');
            }
        }
    };

    const getConfidentialityColor = (level) => {
        const colors = {
            1: 'success',
            2: 'info',
            3: 'warning',
            4: 'error',
            5: 'secondary'
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
            otro: 'default'
        };
        return colors[type] || 'default';
    };

    return (
        <Paper elevation={3} sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" fontWeight="bold">
                    Documentos
                </Typography>
                <Button
                    variant="contained"
                    onClick={() => navigate('/documents/upload')}
                >
                    Subir Documento
                </Button>
            </Box>

            {/* Filtros */}
            <Box display="flex" gap={2} mb={3}>
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
                    sx={{ flex: 1 }}
                />

                <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                        value={filterType}
                        onChange={handleTypeFilter}
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
                    <InputLabel>Caso</InputLabel>
                    <Select
                        value={filterCase}
                        onChange={handleCaseFilter}
                        label="Caso"
                    >
                        <MenuItem value="">Todos</MenuItem>
                        {cases.map(caso => (
                            <MenuItem key={caso.id} value={caso.id}>
                                {caso.numero_caso}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Button variant="outlined" onClick={fetchDocuments}>
                    Aplicar
                </Button>
            </Box>

            {/* Tabla */}
            {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nombre</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Caso</TableCell>
                                <TableCell>Confidencialidad</TableCell>
                                <TableCell>Propietario</TableCell>
                                <TableCell>Estado</TableCell>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {documents.map((doc) => (
                                <TableRow key={doc.id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="medium">
                                            {doc.nombre_original}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {doc.extension?.toUpperCase()} • {(doc.tamaño_bytes / 1024).toFixed(1)} KB
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={doc.tipo_documento}
                                            color={getTypeColor(doc.tipo_documento)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {doc.caso_numero || 'Sin caso'}
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
                                        {doc.bloqueado_por ? (
                                            <Chip
                                                icon={<LockIcon />}
                                                label="Bloqueado"
                                                color="error"
                                                size="small"
                                            />
                                        ) : (
                                            <Chip
                                                icon={<LockOpenIcon />}
                                                label="Disponible"
                                                color="success"
                                                size="small"
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(doc.fecha_upload).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" gap={1}>
                                            <Tooltip title="Ver">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleViewDocument(doc.id)}
                                                >
                                                    <VisibilityIcon fontSize="small" />
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
                                                    onClick={() => handleDelete(doc.id)}
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
    );
};

export default DocumentList;
