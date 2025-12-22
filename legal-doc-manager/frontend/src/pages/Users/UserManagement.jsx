import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
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
    Switch,
    FormControlLabel,
    Menu,
    Tooltip,
    Avatar,
    Divider,
} from '@mui/material';
import {
    Search as SearchIcon,
    Add as AddIcon,
    FilterList as FilterIcon,
    MoreVert as MoreIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Lock as LockIcon,
    LockOpen as UnlockIcon,
    AdminPanelSettings as AdminIcon,
    Gavel as LawyerIcon,
    Assistant as AssistantIcon,
    Refresh as RefreshIcon,
    Visibility as ViewIcon,
    Key as KeyIcon,
    LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import { userService } from '../../services/api';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

const UserManagement = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [newUserDialog, setNewUserDialog] = useState(false);
    const [editUserDialog, setEditUserDialog] = useState(false);
    const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, userId: null });
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userForm, setUserForm] = useState({
        email: '',
        password: '',
        nombre: '',
        apellido: '',
        rol: 'abogado',
        permisos: 'lectura',
        activo: true,
    });
    const [resetPasswordForm, setResetPasswordForm] = useState({
        newPassword: '',
        confirmPassword: '',
    });

    useEffect(() => {
        if (user?.rol === 'admin') {
            fetchUsers();
        }
    }, [user]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            // En una implementación real, usarías userService.getAll()
            // Por ahora, usamos datos de ejemplo
            setTimeout(() => {
                const mockUsers = [
                    {
                        id: 1,
                        email: 'admin@legal.com',
                        nombre: 'Administrador',
                        apellido: 'Sistema',
                        rol: 'admin',
                        permisos: 'full',
                        activo: true,
                        fecha_creacion: '2024-01-01T00:00:00',
                        ultimo_acceso: '2024-03-20T14:30:00',
                        intentos_login: 0,
                    },
                    {
                        id: 2,
                        email: 'maria.gonzalez@legal.com',
                        nombre: 'María',
                        apellido: 'González',
                        rol: 'abogado',
                        permisos: 'full',
                        activo: true,
                        fecha_creacion: '2024-01-15T09:00:00',
                        ultimo_acceso: '2024-03-20T15:45:00',
                        intentos_login: 0,
                    },
                    {
                        id: 3,
                        email: 'carlos.rodriguez@legal.com',
                        nombre: 'Carlos',
                        apellido: 'Rodríguez',
                        rol: 'abogado',
                        permisos: 'editor',
                        activo: true,
                        fecha_creacion: '2024-02-01T10:30:00',
                        ultimo_acceso: '2024-03-19T16:20:00',
                        intentos_login: 0,
                    },
                    {
                        id: 4,
                        email: 'ana.martinez@legal.com',
                        nombre: 'Ana',
                        apellido: 'Martínez',
                        rol: 'asistente',
                        permisos: 'lectura',
                        activo: true,
                        fecha_creacion: '2024-02-15T14:15:00',
                        ultimo_acceso: '2024-03-20T11:10:00',
                        intentos_login: 2,
                    },
                    {
                        id: 5,
                        email: 'pedro.sanchez@legal.com',
                        nombre: 'Pedro',
                        apellido: 'Sánchez',
                        rol: 'abogado',
                        permisos: 'editor',
                        activo: false,
                        fecha_creacion: '2024-03-01T08:45:00',
                        ultimo_acceso: '2024-03-10T12:30:00',
                        intentos_login: 0,
                    },
                ];
                setUsers(mockUsers);
                setLoading(false);
            }, 1000);
        } catch (error) {
            toast.error('Error cargando usuarios');
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    const handleFilterRole = (e) => {
        setFilterRole(e.target.value);
    };

    const handleFilterStatus = (e) => {
        setFilterStatus(e.target.value);
    };

    const handleMenuOpen = (event, usuario) => {
        setAnchorEl(event.currentTarget);
        setSelectedUser(usuario);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedUser(null);
    };

    const handleNewUser = () => {
        setUserForm({
            email: '',
            password: '',
            nombre: '',
            apellido: '',
            rol: 'abogado',
            permisos: 'lectura',
            activo: true,
        });
        setNewUserDialog(true);
    };

    const handleEditUser = (usuario) => {
        setUserForm({
            email: usuario.email,
            password: '', // No mostrar contraseña actual
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            rol: usuario.rol,
            permisos: usuario.permisos,
            activo: usuario.activo,
        });
        setSelectedUser(usuario);
        setEditUserDialog(true);
        handleMenuClose();
    };

    const handleResetPassword = (usuario) => {
        setSelectedUser(usuario);
        setResetPasswordForm({
            newPassword: '',
            confirmPassword: '',
        });
        setResetPasswordDialog(true);
        handleMenuClose();
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        try {
            // En una implementación real: await userService.toggleStatus(userId, !currentStatus)
            setUsers(users.map(u =>
                u.id === userId ? { ...u, activo: !currentStatus } : u
            ));
            toast.success(`Usuario ${!currentStatus ? 'activado' : 'desactivado'}`);
        } catch (error) {
            toast.error('Error actualizando estado del usuario');
        }
    };

    const handleDeleteUser = () => {
        if (selectedUser) {
            setDeleteDialog({ open: true, userId: selectedUser.id });
        }
        handleMenuClose();
    };

    const handleDeleteConfirm = async () => {
        try {
            // En una implementación real: await userService.delete(deleteDialog.userId)
            setUsers(users.filter(u => u.id !== deleteDialog.userId));
            toast.success('Usuario eliminado');
            setDeleteDialog({ open: false, userId: null });
        } catch (error) {
            toast.error('Error eliminando usuario');
        }
    };

    const handleCreateUser = async () => {
        // Validaciones básicas
        if (!userForm.email || !userForm.password || !userForm.nombre || !userForm.apellido) {
            toast.error('Por favor complete todos los campos requeridos');
            return;
        }

        if (userForm.password.length < 8) {
            toast.error('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        try {
            // En una implementación real: await userService.create(userForm)
            const newUser = {
                id: users.length + 1,
                ...userForm,
                fecha_creacion: new Date().toISOString(),
                ultimo_acceso: null,
                intentos_login: 0,
            };

            setUsers([...users, newUser]);
            setNewUserDialog(false);
            setUserForm({
                email: '',
                password: '',
                nombre: '',
                apellido: '',
                rol: 'abogado',
                permisos: 'lectura',
                activo: true,
            });

            toast.success('Usuario creado exitosamente');
        } catch (error) {
            toast.error('Error creando usuario');
        }
    };

    const handleUpdateUser = async () => {
        if (!selectedUser) return;

        // Validaciones básicas
        if (!userForm.nombre || !userForm.apellido) {
            toast.error('Nombre y apellido son requeridos');
            return;
        }

        try {
            // En una implementación real: await userService.update(selectedUser.id, userForm)
            setUsers(users.map(u =>
                u.id === selectedUser.id ? { ...u, ...userForm } : u
            ));

            setEditUserDialog(false);
            setSelectedUser(null);
            toast.success('Usuario actualizado exitosamente');
        } catch (error) {
            toast.error('Error actualizando usuario');
        }
    };

    const handleResetPasswordConfirm = async () => {
        if (!selectedUser) return;

        // Validaciones
        if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        if (resetPasswordForm.newPassword.length < 8) {
            toast.error('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        try {
            // En una implementación real: await userService.resetPassword(selectedUser.id, resetPasswordForm.newPassword)
            toast.success('Contraseña restablecida exitosamente');
            setResetPasswordDialog(false);
            setSelectedUser(null);
            setResetPasswordForm({
                newPassword: '',
                confirmPassword: '',
            });
        } catch (error) {
            toast.error('Error restableciendo contraseña');
        }
    };

    const getUserInitials = (nombre, apellido) => {
        return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase();
    };

    const getRoleIcon = (rol) => {
        switch (rol) {
            case 'admin': return <AdminIcon />;
            case 'abogado': return <LawyerIcon />;
            case 'asistente': return <AssistantIcon />;
            default: return <PersonIcon />;
        }
    };

    const getRoleColor = (rol) => {
        switch (rol) {
            case 'admin': return 'error';
            case 'abogado': return 'primary';
            case 'asistente': return 'success';
            default: return 'default';
        }
    };

    const getRoleLabel = (rol) => {
        switch (rol) {
            case 'admin': return 'Administrador';
            case 'abogado': return 'Abogado';
            case 'asistente': return 'Asistente';
            default: return rol;
        }
    };

    const getPermissionsLabel = (permisos) => {
        switch (permisos) {
            case 'full': return 'Completo';
            case 'editor': return 'Editor';
            case 'lectura': return 'Solo lectura';
            default: return permisos;
        }
    };

    const getPermissionsColor = (permisos) => {
        switch (permisos) {
            case 'full': return 'error';
            case 'editor': return 'warning';
            case 'lectura': return 'success';
            default: return 'default';
        }
    };

    const filteredUsers = users.filter(usuario => {
        const matchesSearch =
            usuario.email.toLowerCase().includes(search.toLowerCase()) ||
            usuario.nombre.toLowerCase().includes(search.toLowerCase()) ||
            usuario.apellido.toLowerCase().includes(search.toLowerCase());

        const matchesRole = !filterRole || usuario.rol === filterRole;
        const matchesStatus = filterStatus === '' ||
            (filterStatus === 'activo' && usuario.activo) ||
            (filterStatus === 'inactivo' && !usuario.activo);

        return matchesSearch && matchesRole && matchesStatus;
    });

    const roleOptions = [
        { value: 'admin', label: 'Administrador' },
        { value: 'abogado', label: 'Abogado' },
        { value: 'asistente', label: 'Asistente' },
    ];

    const permissionsOptions = [
        { value: 'lectura', label: 'Solo lectura' },
        { value: 'editor', label: 'Editor' },
        { value: 'full', label: 'Completo' },
    ];

    const stats = {
        total: users.length,
        active: users.filter(u => u.activo).length,
        admins: users.filter(u => u.rol === 'admin').length,
        lawyers: users.filter(u => u.rol === 'abogado').length,
        assistants: users.filter(u => u.rol === 'asistente').length,
    };

    if (user?.rol !== 'admin') {
        return (
            <Box p={3}>
                <Alert severity="error">
                    <Typography variant="h6" gutterBottom>
                        Acceso denegado
                    </Typography>
                    <Typography>
                        Solo los administradores pueden acceder a la gestión de usuarios.
                    </Typography>
                </Alert>
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">
                        Gestión de Usuarios
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Administración de usuarios del sistema
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleNewUser}
                >
                    Nuevo Usuario
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
                                        Total Usuarios
                                    </Typography>
                                </Box>
                                <PersonIcon color="primary" sx={{ fontSize: 40 }} />
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
                                        Usuarios Activos
                                    </Typography>
                                </Box>
                                <LockOpenIcon color="success" sx={{ fontSize: 40 }} />
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
                                        {stats.admins}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Administradores
                                    </Typography>
                                </Box>
                                <AdminIcon color="error" sx={{ fontSize: 40 }} />
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
                                        {stats.lawyers + stats.assistants}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Personal Legal
                                    </Typography>
                                </Box>
                                <LawyerIcon color="info" sx={{ fontSize: 40 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filtros */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
                    <TextField
                        placeholder="Buscar usuarios..."
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
                        <InputLabel>Rol</InputLabel>
                        <Select
                            value={filterRole}
                            onChange={handleFilterRole}
                            label="Rol"
                        >
                            <MenuItem value="">Todos</MenuItem>
                            {roleOptions.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 150 }}>
                        <InputLabel>Estado</InputLabel>
                        <Select
                            value={filterStatus}
                            onChange={handleFilterStatus}
                            label="Estado"
                        >
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="activo">Activos</MenuItem>
                            <MenuItem value="inactivo">Inactivos</MenuItem>
                        </Select>
                    </FormControl>

                    <Box display="flex" gap={1}>
                        <Button
                            variant="outlined"
                            startIcon={<FilterIcon />}
                            onClick={() => {
                                // Los filtros se aplican automáticamente
                            }}
                        >
                            Filtrar
                        </Button>
                        <IconButton onClick={fetchUsers}>
                            <RefreshIcon />
                        </IconButton>
                    </Box>
                </Box>
            </Paper>

            {/* Tabla de usuarios */}
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
                                    <TableCell>Usuario</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Rol</TableCell>
                                    <TableCell>Permisos</TableCell>
                                    <TableCell>Estado</TableCell>
                                    <TableCell>Último Acceso</TableCell>
                                    <TableCell align="center">Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredUsers.map((usuario) => (
                                    <TableRow key={usuario.id} hover>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={2}>
                                                <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                                                    {getUserInitials(usuario.nombre, usuario.apellido)}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {usuario.nombre} {usuario.apellido}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        ID: {usuario.id}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <EmailIcon fontSize="small" color="action" />
                                                <Typography variant="body2">
                                                    {usuario.email}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={getRoleIcon(usuario.rol)}
                                                label={getRoleLabel(usuario.rol)}
                                                color={getRoleColor(usuario.rol)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={getPermissionsLabel(usuario.permisos)}
                                                color={getPermissionsColor(usuario.permisos)}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            size="small"
                                                            checked={usuario.activo}
                                                            onChange={() => handleToggleStatus(usuario.id, usuario.activo)}
                                                            disabled={usuario.id === user?.id} // No permitir desactivarse a sí mismo
                                                        />
                                                    }
                                                    label={
                                                        <Chip
                                                            label={usuario.activo ? 'Activo' : 'Inactivo'}
                                                            color={usuario.activo ? 'success' : 'default'}
                                                            size="small"
                                                        />
                                                    }
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {usuario.ultimo_acceso ? (
                                                <Typography variant="body2">
                                                    {moment(usuario.ultimo_acceso).format('DD/MM/YYYY HH:mm')}
                                                </Typography>
                                            ) : (
                                                <Typography variant="caption" color="textSecondary">
                                                    Nunca
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Box display="flex" gap={1} justifyContent="center">
                                                <Tooltip title="Editar">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleEditUser(usuario)}
                                                        disabled={usuario.id === user?.id} // No permitir editar su propio usuario aquí
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Restablecer contraseña">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleResetPassword(usuario)}
                                                    >
                                                        <KeyIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Más opciones">
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => handleMenuOpen(e, usuario)}
                                                        disabled={usuario.id === user?.id} // No permitir eliminarse a sí mismo
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

                    {filteredUsers.length === 0 && (
                        <Box p={4} textAlign="center">
                            <Typography variant="h6" color="textSecondary" gutterBottom>
                                No se encontraron usuarios
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {search || filterRole || filterStatus
                                    ? 'Intenta con otros filtros de búsqueda'
                                    : 'Crea tu primer usuario haciendo clic en "Nuevo Usuario"'}
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
                <MenuItem onClick={() => handleEditUser(selectedUser)}>
                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                    Editar usuario
                </MenuItem>
                <MenuItem onClick={() => handleResetPassword(selectedUser)}>
                    <KeyIcon fontSize="small" sx={{ mr: 1 }} />
                    Restablecer contraseña
                </MenuItem>
                <MenuItem onClick={() => {
                    // Ver actividad del usuario
                    handleMenuClose();
                }}>
                    <ViewIcon fontSize="small" sx={{ mr: 1 }} />
                    Ver actividad
                </MenuItem>
                <Divider />
                <MenuItem
                    onClick={handleDeleteUser}
                    sx={{ color: 'error.main' }}
                    disabled={selectedUser?.id === user?.id}
                >
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    Eliminar usuario
                </MenuItem>
            </Menu>

            {/* Diálogo para nuevo usuario */}
            <Dialog open={newUserDialog} onClose={() => setNewUserDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Nuevo Usuario</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Nombre"
                                name="nombre"
                                value={userForm.nombre}
                                onChange={(e) => setUserForm({ ...userForm, nombre: e.target.value })}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Apellido"
                                name="apellido"
                                value={userForm.apellido}
                                onChange={(e) => setUserForm({ ...userForm, apellido: e.target.value })}
                                required
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={userForm.email}
                                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                required
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Contraseña"
                                name="password"
                                type="password"
                                value={userForm.password}
                                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                                required
                                helperText="Mínimo 8 caracteres"
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Rol</InputLabel>
                                <Select
                                    name="rol"
                                    value={userForm.rol}
                                    onChange={(e) => setUserForm({ ...userForm, rol: e.target.value })}
                                    label="Rol"
                                >
                                    {roleOptions.map(option => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Permisos</InputLabel>
                                <Select
                                    name="permisos"
                                    value={userForm.permisos}
                                    onChange={(e) => setUserForm({ ...userForm, permisos: e.target.value })}
                                    label="Permisos"
                                >
                                    {permissionsOptions.map(option => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={userForm.activo}
                                        onChange={(e) => setUserForm({ ...userForm, activo: e.target.checked })}
                                    />
                                }
                                label="Usuario activo"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setNewUserDialog(false)}>Cancelar</Button>
                    <Button onClick={handleCreateUser} variant="contained">
                        Crear Usuario
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo para editar usuario */}
            <Dialog open={editUserDialog} onClose={() => setEditUserDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Editar Usuario</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Nombre"
                                name="nombre"
                                value={userForm.nombre}
                                onChange={(e) => setUserForm({ ...userForm, nombre: e.target.value })}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Apellido"
                                name="apellido"
                                value={userForm.apellido}
                                onChange={(e) => setUserForm({ ...userForm, apellido: e.target.value })}
                                required
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={userForm.email}
                                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                                required
                                disabled // No permitir cambiar email
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Rol</InputLabel>
                                <Select
                                    name="rol"
                                    value={userForm.rol}
                                    onChange={(e) => setUserForm({ ...userForm, rol: e.target.value })}
                                    label="Rol"
                                >
                                    {roleOptions.map(option => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Permisos</InputLabel>
                                <Select
                                    name="permisos"
                                    value={userForm.permisos}
                                    onChange={(e) => setUserForm({ ...userForm, permisos: e.target.value })}
                                    label="Permisos"
                                >
                                    {permissionsOptions.map(option => (
                                        <MenuItem key={option.value} value={option.value}>
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={userForm.activo}
                                        onChange={(e) => setUserForm({ ...userForm, activo: e.target.checked })}
                                        disabled={selectedUser?.id === user?.id} // No permitir desactivarse a sí mismo
                                    />
                                }
                                label="Usuario activo"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditUserDialog(false)}>Cancelar</Button>
                    <Button onClick={handleUpdateUser} variant="contained">
                        Actualizar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo para restablecer contraseña */}
            <Dialog open={resetPasswordDialog} onClose={() => setResetPasswordDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Restablecer Contraseña</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" gutterBottom>
                        Restableciendo contraseña para: <strong>{selectedUser?.nombre} {selectedUser?.apellido}</strong>
                    </Typography>

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Nueva Contraseña"
                                type="password"
                                value={resetPasswordForm.newPassword}
                                onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, newPassword: e.target.value })}
                                required
                                helperText="Mínimo 8 caracteres"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Confirmar Contraseña"
                                type="password"
                                value={resetPasswordForm.confirmPassword}
                                onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, confirmPassword: e.target.value })}
                                required
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResetPasswordDialog(false)}>Cancelar</Button>
                    <Button onClick={handleResetPasswordConfirm} variant="contained">
                        Restablecer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Diálogo de confirmación para eliminar */}
            <Dialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, userId: null })}
            >
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        ¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.
                    </Alert>
                    <Typography variant="body2">
                        El usuario será eliminado permanentemente del sistema.
                        Todos los documentos y actividades asociadas permanecerán en el sistema.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, userId: null })}>
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

export default UserManagement;
