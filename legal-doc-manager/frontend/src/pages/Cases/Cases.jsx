import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    TextField,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Card,
    CardContent,
    LinearProgress,
    Alert,
    Menu,
    Tooltip,
    Badge,
    Divider,
} from '@mui/material';
import {
    Search as SearchIcon,
    Add as AddIcon,
    FilterList as FilterIcon,
    MoreVert as MoreIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Folder as FolderIcon,
    Person as PersonIcon,
    Schedule as ScheduleIcon,
    Warning as WarningIcon,
    CheckCircle as CheckIcon,
    Gavel as CaseIcon,
    Download as DownloadIcon,
    Visibility as ViewIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

const Cases = () => {
    const navigate = useNavigate();
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [newCaseDialog, setNewCaseDialog] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, caseId: null });
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedCase, setSelectedCase] = useState(null);
    const [caseForm, setCaseForm] = useState({
        numero_caso: '',
        titulo: '',
        descripcion: '',
        cliente_id: '',
        abogado_responsable: '',
        prioridad: 'media',
        estado: 'activo',
    });

    // Datos de ejemplo
    const mockCases = [
        {
            id: 1,
            numero_caso: 'LAW-2024-001',
            titulo: 'Demanda por Incumplimiento Contractual',
            descripcion: 'Caso relacionado con incumplimiento de contrato de servicios',
            cliente_id: 1,
            cliente_nombre: 'Empresa ABC S.A.',
            abogado_responsable: 1,
            abogado_nombre: 'María González',
            estado: 'activo',
            prioridad: 'alta',
            fecha_apertura: '2024-01-15T10:30:00',
            fecha_cierre: null,
            documentos_count: 12,
        },
        {
            id: 2,
            numero_caso: 'LAW-2024-002',
            titulo: 'Reclamación de Fianza',
            descripcion: 'Reclamación de fianza de arrendamiento',
            cliente_id: 2,
            cliente_nombre: 'Juan Pérez',
            abogado_responsable: 2,
            abogado_nombre: 'Carlos Rodríguez',
            estado: 'activo',
            prioridad: 'media',
            fecha_apertura: '2024-02-01T14:20:00',
            fecha_cierre: null,
            documentos_count: 8,
        },
        {
            id: 3,
            numero_caso: 'LAW-2024-003',
            titulo: 'Contrato de Compraventa',
            descripcion: 'Elaboración y revisión de contrato de compraventa',
            cliente_id: 3,
            cliente_nombre: 'Inversiones XYZ S.L.',
            abogado_responsable: 1,
            abogado_nombre: 'María González',
            estado: 'cerrado',
            prioridad: 'baja',
            fecha_apertura: '2024-01-10T09:15:00',
            fecha_cierre: '2024-03-20T16:45:00',
            documentos_count: 5,
        },
        {
            id: 4,
            numero_caso: 'LAW-2024-004',
            titulo: 'Demanda Laboral',
            descripcion: 'Caso de despido injustificado',
            cliente_id: 4,
            cliente_nombre: 'Ana Martínez',
            abogado_responsable: 3,
            abogado_nombre: 'Laura Fernández',
            estado: 'activo',
            prioridad: 'urgente',
            fecha_apertura: '2024-03-05T11:00:00',
            fecha_cierre: null,
            documentos_count: 15,
        },
    ];

    const mockClients = [
        { id: 1, nombre: 'Empresa ABC S.A.' },
        { id: 2, nombre: 'Juan Pérez' },
        { id: 3, nombre: 'Inversiones XYZ S.L.' },
        { id: 4, nombre: 'Ana Martínez' },
        { id: 5, nombre: 'Constructora Delta' },
    ];

    const mockLawyers = [
        { id: 1, nombre: 'María González' },
        { id: 2, nombre: 'Carlos Rodríguez' },
        { id: 3, nombre: 'Laura Fernández' },
        { id: 4, nombre: 'Pedro Sánchez' },
    ];

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = () => {
        setLoading(true);
        // Simular carga de API
        setTimeout(() => {
            setCases(mockCases);
            setLoading(false);
        }, 1000);
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    const handleFilterStatus = (e) => {
        setFilterStatus(e.target.value);
    };

    const handleFilterPriority = (e) => {
        setFilterPriority(e.target.value);
    };

    const handleMenuOpen = (event, caso) => {
        setAnchorEl(event.currentTarget);
        setSelectedCase(caso);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedCase(null);
    };

    const handleViewCase = (caseId) => {
        navigate(`/cases/${caseId}`);
    };

    const handleEditCase = (caseId) => {
        // Implementar edición
        toast.success('Funcionalidad de edición en desarrollo');
        handleMenuClose();
    };

    const handleDeleteCase = () => {
        if (selectedCase) {
            setDeleteDialog({ open: true, caseId: selectedCase.id });
        }
        handleMenuClose();
    };

    const handleDeleteConfirm = () => {
        // Implementar eliminación
        setCases(cases.filter(c => c.id !== deleteDialog.caseId));
        toast.success('Caso eliminado');
        setDeleteDialog({ open: false, caseId: null });
    };

    const handleNewCase = () => {
        // Generar número de caso automático
        const nextNumber = cases.length + 1;
        setCaseForm({
            ...caseForm,
            numero_caso: `LAW-${new Date().getFullYear()}-${String(nextNumber).padStart(3, '0')}`,
        });
        setNewCaseDialog(true);
    };

    const handleCaseFormChange = (e) => {
        const { name, value } = e.target;
        setCaseForm({
            ...caseForm,
            [name]: value,
        });
    };

    const handleCreateCase = () => {
        // Validar
        if (!caseForm.titulo.trim()) {
            toast.error('El título es requerido');
            return;
        }

        // Crear nuevo caso
        const newCase = {
            id: cases.length + 1,
            ...caseForm,
            cliente_nombre: mockClients.find(c => c.id == caseForm.cliente_id)?.nombre || '',
            abogado_nombre: mockLawyers.find(l => l.id == caseForm.abogado_responsable)?.nombre || '',
            documentos_count: 0,
            fecha_apertura: new Date().toISOString(),
            fecha_cierre: null,
        };

        setCases([newCase, ...cases]);
        setNewCaseDialog(false);
        setCaseForm({
            numero_caso: '',
            titulo: '',
            descripcion: '',
            cliente_id: '',
            abogado_responsable: '',
            prioridad: 'media',
            estado: 'activo',
        });

        toast.success('Caso creado exitosamente');
    };

    const getStatusColor = (status) => {
        const colors = {
            'activo': 'success',
            'cerrado': 'default',
            'pendiente': 'warning',
            'archivado': 'secondary',
        };
        return colors[status] || 'default';
    };

    const getStatusLabel = (status) => {
        const labels = {
            'activo': 'Activo',
            'cerrado': 'Cerrado',
            'pendiente': 'Pendiente',
            'archivado': 'Archivado',
        };
        return labels[status] || status;
    };

    const getPriorityColor = (priority) => {
        const colors = {
            'baja': 'success',
            'media': 'warning',
            'alta': 'error',
            'urgente': 'error',
        };
        return colors[priority] || 'default';
    };

    const getPriorityLabel = (priority) => {
        const labels = {
            'baja': 'Baja',
            'media': 'Media',
            'alta': 'Alta',
            'urgente': 'Urgente',
        };
        return labels[priority] || priority;
    };

    const filteredCases = cases.filter(caso => {
        const matchesSearch =
            caso.numero_caso.toLowerCase().includes(search.toLowerCase()) ||
            caso.titulo.toLowerCase().includes(search.toLowerCase()) ||
            caso.cliente_nombre.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = !filterStatus || caso.estado === filterStatus;
        const matchesPriority = !filterPriority || caso.prioridad === filterPriority;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    const statusOptions = [
        { value: 'activo', label: 'Activo' },
        { value: 'pendiente', label: 'Pendiente' },
        { value: 'cerrado', label: 'Cerrado' },
        { value: 'archivado', label: 'Archivado' },
    ];

    const priorityOptions = [
        { value: 'baja', label: 'Baja' },
        { value: 'media', label: 'Media' },
        { value: 'alta', label: 'Alta' },
        { value: 'urgente', label: 'Urgente' },
    ];

    const stats = {
        total: cases.length,
        active: cases.filter(c => c.estado === 'activo').length,
        closed: cases.filter(c => c.estado === 'cerrado').length,
        urgent: cases.filter(c => c.prioridad === 'urgente').length,
    };

    return (
        <Box>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">
                        Casos Legales
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Gestión de casos y expedientes
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleNewCase}
                >
                    Nuevo Caso
                </Button>
            </Box>

            {/* Estadísticas */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="h4" fontWeight="bold">
                                        {stats.total}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Total de Casos
                                    </Typography>
                                </Box>
                                <CaseIcon color="primary" sx={{ fontSize: 40 }} />
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
                                        {stats.active}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Casos Activos
                                    </Typography>
                                </Box>
                                <CheckIcon color="success" sx={{ fontSize: 40 }} />
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
                                        {stats.closed}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Casos Cerrados
                                    </Typography>
                                </Box>
                                <ScheduleIcon color="warning" sx={{ fontSize: 40 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="h4" fontWeight="bold" color="error.main">
                                        {stats.urgent}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Casos Urgentes
                                    </Typography>
                                </Box>
                                <WarningIcon color="error" sx={{ fontSize: 40 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filtros */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
                    <TextField
                        placeholder="Buscar casos..."
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
                        <InputLabel>Estado</InputLabel>
                        <Select
                            value={filterStatus}
                            onChange={handleFilterStatus}
                            label="Estado"
                        >
                            <MenuItem value="">Todos</MenuItem>
                            {statusOptions.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 150 }}>
                        <InputLabel>Prioridad</InputLabel>
                        <Select
                            value={filterPriority}
                            onChange={handleFilterPriority}
                            label="Prioridad"
                        >
                            <MenuItem value="">Todas</MenuItem>
                            {priorityOptions.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box display="flex" gap={1}>
                        <Button
                            variant="outlined"
                            startIcon={<FilterIcon />}
                            onClick={() => {
                                // Aplicar filtros ya están aplicados automáticamente
                            }}
                        >
                            Filtrar
                        </Button>
                        <IconButton onClick={fetchCases}>
                            <RefreshIcon />
                        </IconButton>
                    </Box>
                </Box>
            </Paper>

            {/* Tabla de casos */}
            {loading ? (
                <Box display="flex" justifyContent="center" p={4}>
                    <LinearProgress sx={{ width: '100%', maxWidth: 600 }} />
                </Box>
            ) : (
                <Paper>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Número de Caso</TableCell>
                                    <TableCell>Título</TableCell>
                                    <TableCell>Cliente</TableCell>
                                    <TableCell>Abogado Responsable</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell>Prioridad</TableCell>
                                    <TableCell>Documentos</TableCell>
                                    <TableCell>Fecha Apertura</TableCell>
                                    <TableCell align="center">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredCases.map((caso) => (
                                    <TableRow key={caso.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">
                                                {caso.numero_caso}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="medium">
                                                {caso.titulo}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary" display="block">
                                                {caso.descripcion.substring(0, 60)}...
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <PersonIcon fontSize="small" color="action" />
                                                <Typography variant="body2">
                                                    {caso.cliente_nombre}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {caso.abogado_nombre}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getStatusLabel(caso.estado)}
                                                color={getStatusColor(caso.estado)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getPriorityLabel(caso.prioridad)}
                                                color={getPriorityColor(caso.prioridad)}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Badge badgeContent={caso.documentos_count} color="primary">
                                                <FolderIcon color="action" />
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {moment(caso.fecha_apertura).format('DD/MM/YYYY')}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box display="flex" gap={1} justifyContent="center">
                                                <Tooltip title="Ver documentos">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => navigate(`/documents?caso_id=${caso.id}`)}
                                                    >
                                                        <FolderIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Ver detalles">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleViewCase(caso.id)}
                                                    >
                                                        <ViewIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Más opciones">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => handleMenuOpen(e, caso)}
                                                    >
                                                        <MoreIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {filteredCases.length === 0 && (
                        <Box p={4} textAlign="center">
                            <Typography variant="h6" color="textSecondary" gutterBottom>
                                No se encontraron casos
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {search || filterStatus || filterPriority
                                    ? 'Intenta con otros filtros de búsqueda'
                                    : 'Crea tu primer caso haciendo clic en "Nuevo Caso"'}
                            </Typography>
                        </Box>
                    )}
                </Paper>
            )}

            {/* Menú de acciones */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => handleViewCase(selectedCase?.id)}>
                    <ViewIcon fontSize="small" sx={{ mr: 1 }} />
                    Ver detalles
                </MenuItem>
                <MenuItem onClick={() => handleEditCase(selectedCase?.id)}>
                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                    Editar
                </MenuItem>
                <MenuItem onClick={() => navigate(`/documents/upload?caso_id=${selectedCase?.id}`)}>
                    <AddIcon fontSize="small" sx={{ mr: 1 }} />
                    Agregar documento
                </MenuItem>
                <MenuItem onClick={() => navigate(`/documents?caso_id=${selectedCase?.id}`)}>
                    <FolderIcon fontSize="small" sx={{ mr: 1 }} />
                    Ver documentos
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleDeleteCase} sx={{ color: 'error.main' }}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    Eliminar
                </MenuItem>
            </Menu>

            {/* Diálogo para nuevo caso */}
            <Dialog open={newCaseDialog} onClose={() => setNewCaseDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Nuevo Caso Legal</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Número de Caso"
                                name="numero_caso"
                                value={caseForm.numero_caso}
                                onChange={handleCaseFormChange}
                                required
                                disabled
                                helperText="Generado automáticamente"
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Estado</InputLabel>
                                <Select
                                    name="estado"
                                    value={caseForm.estado}
                                    onChange={handleCaseFormChange}
                                    label="Estado"
                                >
                                    {statusOptions.map(option => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Título del Caso"
                                name="titulo"
                                value={caseForm.titulo}
                                onChange={handleCaseFormChange}
                                required
                                placeholder="Ej: Demanda por Incumplimiento Contractual"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Descripción"
                                name="descripcion"
                                value={caseForm.descripcion}
                                onChange={handleCaseFormChange}
                                multiline
                                rows={3}
                                placeholder="Describe brevemente el caso..."
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Cliente</InputLabel>
                                <Select
                                    name="cliente_id"
                                    value={caseForm.cliente_id}
                                    onChange={handleCaseFormChange}
                                    label="Cliente"
                                >
                                    <MenuItem value="">
                                        <em>Seleccionar cliente</em>
                                    </MenuItem>
                                    {mockClients.map(client => (
                                        <MenuItem key={client.id} value={client.id}>
                                            {client.nombre}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Abogado Responsable</InputLabel>
                                <Select
                                    name="abogado_responsable"
                                    value={caseForm.abogado_responsable}
                                    onChange={handleCaseFormChange}
                                    label="Abogado Responsable"
                                >
                                    <MenuItem value="">
                                        <em>Seleccionar abogado</em>
                                    </MenuItem>
                                    {mockLawyers.map(lawyer => (
                                        <MenuItem key={lawyer.id} value={lawyer.id}>
                                            {lawyer.nombre}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Prioridad</InputLabel>
                                <Select
                                    name="prioridad"
                                    value={caseForm.prioridad}
                                    onChange={handleCaseFormChange}
                                    label="Prioridad"
                                >
                                    {priorityOptions.map(option => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNewCaseDialog(false)}>Cancelar</Button>
                    <Button onClick={handleCreateCase} variant="contained">
                        Crear Caso
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo de confirmación para eliminar */}
            <Dialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, caseId: null })}
            >
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        ¿Está seguro de eliminar este caso? Esta acción no se puede deshacer.
                    </Alert>
                    <Typography variant="body2">
                        El caso será eliminado permanentemente del sistema.
                        Los documentos asociados no serán eliminados, pero perderán la referencia al caso.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, caseId: null })}>
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

export default Cases;
