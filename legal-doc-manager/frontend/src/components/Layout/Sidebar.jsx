import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    Divider,
    Box,
    Typography,
    Avatar,
    IconButton,
    Tooltip,
    Collapse,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Folder as DocumentsIcon,
    Upload as UploadIcon,
    Gavel as CasesIcon,
    People as UsersIcon,
    History as LogsIcon,
    Person as ProfileIcon,
    Settings as SettingsIcon,
    ChevronLeft,
    ChevronRight,
    ExpandLess,
    ExpandMore,
    Description,
    Lock,
    Share,
    Timeline,
} from '@mui/icons-material';

const drawerWidth = 240;
const collapsedWidth = 60;

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [documentsOpen, setDocumentsOpen] = useState(false);

    const toggleDrawer = () => {
        setCollapsed(!collapsed);
    };

    const toggleDocumentsMenu = () => {
        setDocumentsOpen(!documentsOpen);
    };

    const menuItems = [
        {
            text: 'Dashboard',
            icon: <DashboardIcon />,
            path: '/',
            roles: ['admin', 'abogado', 'asistente'],
        },
        {
            text: 'Documentos',
            icon: <DocumentsIcon />,
            path: '/documents',
            roles: ['admin', 'abogado', 'asistente'],
            submenu: [
                { text: 'Todos los Documentos', icon: <Description />, path: '/documents' },
                { text: 'Subir Documento', icon: <UploadIcon />, path: '/documents/upload' },
                { text: 'Compartidos', icon: <Share />, path: '/documents/shared' },
                { text: 'Bloqueados', icon: <Lock />, path: '/documents/locked' },
            ],
        },
        {
            text: 'Casos',
            icon: <CasesIcon />,
            path: '/cases',
            roles: ['admin', 'abogado'],
        },
        {
            text: 'Usuarios',
            icon: <UsersIcon />,
            path: '/users',
            roles: ['admin'],
        },
        {
            text: 'Logs',
            icon: <LogsIcon />,
            path: '/logs',
            roles: ['admin'],
        },
        {
            text: 'Reportes',
            icon: <Timeline />,
            path: '/reports',
            roles: ['admin'],
        },
        {
            text: 'Perfil',
            icon: <ProfileIcon />,
            path: '/profile',
            roles: ['admin', 'abogado', 'asistente'],
        },
        {
            text: 'Configuración',
            icon: <SettingsIcon />,
            path: '/settings',
            roles: ['admin'],
        },
    ];

    const filteredMenuItems = menuItems.filter(item =>
        item.roles.includes(user?.rol)
    );

    const isActive = (path) => {
        if (path === '/dashboard' && location.pathname === '/') return true;
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getUserInitials = () => {
        if (!user) return 'U';
        return `${user.nombre?.charAt(0) || ''}${user.apellido?.charAt(0) || ''}`.toUpperCase();
    };

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: collapsed ? collapsedWidth : drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: collapsed ? collapsedWidth : drawerWidth,
                    boxSizing: 'border-box',
                    borderRight: '1px solid rgba(0, 0, 0, 0.12)',
                    transition: 'width 0.3s ease',
                    overflowX: 'hidden',
                },
            }}
        >
            {/* Header del Sidebar */}
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                }}
            >
                {!collapsed && (
                    <Typography variant="h6" fontWeight="bold" color="primary">
                        LegalDoc
                    </Typography>
                )}
                <IconButton onClick={toggleDrawer} size="small">
                    {collapsed ? <ChevronRight /> : <ChevronLeft />}
                </IconButton>
            </Box>

            {/* Información del usuario */}
            {!collapsed && user && (
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar
                            sx={{
                                bgcolor: 'primary.main',
                                width: 40,
                                height: 40,
                            }}
                        >
                            {getUserInitials()}
                        </Avatar>
                        <Box>
                            <Typography variant="body1" fontWeight="medium">
                                {user.nombre} {user.apellido}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {user.rol === 'admin' ? 'Administrador' :
                                    user.rol === 'abogado' ? 'Abogado' : 'Asistente'}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            )}

            {/* Menú */}
            <List sx={{ flexGrow: 1 }}>
                {filteredMenuItems.map((item) => (
                    <React.Fragment key={item.text}>
                        {item.submenu ? (
                            <>
                                <ListItem disablePadding sx={{ display: 'block' }}>
                                    <ListItemButton
                                        onClick={toggleDocumentsMenu}
                                        selected={isActive(item.path)}
                                        sx={{
                                            minHeight: 48,
                                            justifyContent: collapsed ? 'center' : 'initial',
                                            px: 2.5,
                                            '&.Mui-selected': {
                                                backgroundColor: 'primary.light',
                                                color: 'primary.contrastText',
                                                '&:hover': {
                                                    backgroundColor: 'primary.main',
                                                },
                                            },
                                        }}
                                    >
                                        <ListItemIcon
                                            sx={{
                                                minWidth: 0,
                                                mr: collapsed ? 0 : 2,
                                                justifyContent: 'center',
                                                color: isActive(item.path) ? 'primary.contrastText' : 'inherit',
                                            }}
                                        >
                                            {item.icon}
                                        </ListItemIcon>
                                        {!collapsed && (
                                            <>
                                                <ListItemText primary={item.text} />
                                                {documentsOpen ? <ExpandLess /> : <ExpandMore />}
                                            </>
                                        )}
                                    </ListItemButton>
                                </ListItem>
                                {!collapsed && (
                                    <Collapse in={documentsOpen} timeout="auto" unmountOnExit>
                                        <List component="div" disablePadding>
                                            {item.submenu.map((subItem) => (
                                                <ListItem key={subItem.text} disablePadding>
                                                    <ListItemButton
                                                        onClick={() => navigate(subItem.path)}
                                                        selected={isActive(subItem.path)}
                                                        sx={{
                                                            pl: 4,
                                                            '&.Mui-selected': {
                                                                backgroundColor: 'action.selected',
                                                            },
                                                        }}
                                                    >
                                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                                            {subItem.icon}
                                                        </ListItemIcon>
                                                        <ListItemText primary={subItem.text} />
                                                    </ListItemButton>
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Collapse>
                                )}
                            </>
                        ) : (
                            <Tooltip title={collapsed ? item.text : ''} placement="right">
                                <ListItem disablePadding>
                                    <ListItemButton
                                        onClick={() => navigate(item.path)}
                                        selected={isActive(item.path)}
                                        sx={{
                                            minHeight: 48,
                                            justifyContent: collapsed ? 'center' : 'initial',
                                            px: 2.5,
                                            '&.Mui-selected': {
                                                backgroundColor: 'primary.light',
                                                color: 'primary.contrastText',
                                                '&:hover': {
                                                    backgroundColor: 'primary.main',
                                                },
                                            },
                                        }}
                                    >
                                        <ListItemIcon
                                            sx={{
                                                minWidth: 0,
                                                mr: collapsed ? 0 : 2,
                                                justifyContent: 'center',
                                                color: isActive(item.path) ? 'primary.contrastText' : 'inherit',
                                            }}
                                        >
                                            {item.icon}
                                        </ListItemIcon>
                                        {!collapsed && <ListItemText primary={item.text} />}
                                    </ListItemButton>
                                </ListItem>
                            </Tooltip>
                        )}
                    </React.Fragment>
                ))}
            </List>

            <Divider />

            {/* Footer del Sidebar */}
            {!collapsed && (
                <Box sx={{ p: 2 }}>
                    <Typography variant="caption" color="textSecondary" display="block">
                        Versión 1.0.0
                    </Typography>
                    <Typography variant="caption" color="textSecondary" display="block">
                        © 2024 LegalDoc
                    </Typography>
                </Box>
            )}
        </Drawer>
    );
};

export default Sidebar;
