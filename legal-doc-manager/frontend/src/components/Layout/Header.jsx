import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Badge,
    Menu,
    MenuItem,
    Avatar,
    Box,
    Tooltip,
    alpha,
    Divider,
    InputBase,
} from '@mui/material';
import {
    Search as SearchIcon,
    Notifications as NotificationsIcon,
    AccountCircle,
    Logout,
    Settings,
    Person,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
        marginLeft: theme.spacing(3),
        width: 'auto',
    },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
    '& .MuiInputBase-input': {
        padding: theme.spacing(1, 1, 1, 0),
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('md')]: {
            width: '20ch',
        },
    },
}));

const Header = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [anchorEl, setAnchorEl] = useState(null);
    const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationsOpen = (event) => {
        setNotificationsAnchorEl(event.currentTarget);
    };

    const handleNotificationsClose = () => {
        setNotificationsAnchorEl(null);
    };

    const handleProfile = () => {
        handleMenuClose();
        navigate('/profile');
    };

    const handleSettings = () => {
        handleMenuClose();
        navigate('/settings');
    };

    const handleLogout = () => {
        handleMenuClose();
        logout();
        navigate('/login');
    };

    const getUserInitials = () => {
        if (!user) return 'U';
        return `${user.nombre?.charAt(0) || ''}${user.apellido?.charAt(0) || ''}`.toUpperCase();
    };

    // Notificaciones de ejemplo
    const notifications = [
        { id: 1, text: 'Documento "Contrato Acme" ha sido actualizado', time: 'Hace 5 minutos' },
        { id: 2, text: 'Nuevo documento compartido contigo', time: 'Hace 1 hora' },
        { id: 3, text: 'Recordatorio: Revisar caso #LAW-2024-001', time: 'Hace 2 horas' },
    ];

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                backgroundColor: 'white',
                color: 'text.primary',
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
            }}
        >
            <Toolbar>
                <Typography
                    variant="h6"
                    noWrap
                    component="div"
                    sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 'bold', color: 'primary.main' }}
                >
                    Sistema LegalDoc
                </Typography>

                <Box sx={{ flexGrow: 1 }} />

                {/* Barra de búsqueda */}
                <Search>
                    <SearchIconWrapper>
                        <SearchIcon />
                    </SearchIconWrapper>
                    <StyledInputBase
                        placeholder="Buscar documentos, casos..."
                        inputProps={{ 'aria-label': 'search' }}
                    />
                </Search>

                {/* Notificaciones */}
                <IconButton
                    size="large"
                    aria-label="show notifications"
                    color="inherit"
                    onClick={handleNotificationsOpen}
                >
                    <Badge badgeContent={notifications.length} color="error">
                        <NotificationsIcon />
                    </Badge>
                </IconButton>
                <Menu
                    anchorEl={notificationsAnchorEl}
                    open={Boolean(notificationsAnchorEl)}
                    onClose={handleNotificationsClose}
                    PaperProps={{
                        sx: {
                            width: 320,
                            maxHeight: 400,
                        },
                    }}
                >
                    <MenuItem disabled>
                        <Typography variant="subtitle2" fontWeight="bold">
                            Notificaciones
                        </Typography>
                    </MenuItem>
                    {notifications.map((notification) => (
                        <MenuItem key={notification.id} onClick={handleNotificationsClose}>
                            <Box>
                                <Typography variant="body2">{notification.text}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                    {notification.time}
                                </Typography>
                            </Box>
                        </MenuItem>
                    ))}
                    <MenuItem onClick={handleNotificationsClose}>
                        <Typography variant="body2" color="primary" sx={{ textAlign: 'center', width: '100%' }}>
                            Ver todas las notificaciones
                        </Typography>
                    </MenuItem>
                </Menu>

                {/* Perfil del usuario */}
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                    <Box sx={{ textAlign: 'right', mr: 2 }}>
                        <Typography variant="body2" fontWeight="medium">
                            {user?.nombre} {user?.apellido}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            {user?.rol === 'admin' ? 'Administrador' :
                                user?.rol === 'abogado' ? 'Abogado' : 'Asistente'}
                        </Typography>
                    </Box>

                    <Tooltip title="Cuenta">
                        <IconButton
                            onClick={handleMenuOpen}
                            size="small"
                            sx={{ ml: 2 }}
                        >
                            <Avatar
                                sx={{
                                    width: 40,
                                    height: 40,
                                    bgcolor: 'primary.main',
                                }}
                            >
                                {getUserInitials()}
                            </Avatar>
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* Menú de perfil */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                >
                    <MenuItem onClick={handleProfile}>
                        <Person sx={{ mr: 1 }} />
                        Mi Perfil
                    </MenuItem>
                    <MenuItem onClick={handleSettings}>
                        <Settings sx={{ mr: 1 }} />
                        Configuración
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                        <Logout sx={{ mr: 1 }} />
                        Cerrar Sesión
                    </MenuItem>
                </Menu>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
