import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Alert,
    InputAdornment,
    IconButton,
    Divider,
} from '@mui/material';
import {
    Email as EmailIcon,
    Lock as LockIcon,
    Visibility,
    VisibilityOff,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const LoginContainer = styled(Container)(({ theme }) => ({
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: theme.spacing(2),
}));

const LoginPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
}));

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await login(formData.email, formData.password);
            if (result.success) {
                navigate('/dashboard');
            } else {
                setError(result.message || 'Error en el inicio de sesión');
            }
        } catch (err) {
            setError('Error en el servidor. Por favor intente más tarde.');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePassword = () => {
        setShowPassword(!showPassword);
    };

    // Credenciales de ejemplo (en desarrollo)
    const fillDemoCredentials = (role) => {
        switch (role) {
            case 'admin':
                setFormData({
                    email: 'admin@legal.com',
                    password: 'Admin123!',
                });
                break;
            case 'abogado':
                setFormData({
                    email: 'abogado@legal.com',
                    password: 'Abogado123!',
                });
                break;
            case 'asistente':
                setFormData({
                    email: 'asistente@legal.com',
                    password: 'Asistente123!',
                });
                break;
        }
    };

    return (
        <LoginContainer>
            <LoginPaper elevation={3}>
                <Box textAlign="center" mb={3}>
                    <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
                        LegalDoc
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Sistema de Gestión Documental Legal
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        margin="normal"
                        required
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EmailIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Contraseña"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        margin="normal"
                        required
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockIcon color="action" />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={handleTogglePassword} edge="end">
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Box mt={2} mb={3}>
                        <Button
                            fullWidth
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{ py: 1.5 }}
                        >
                            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </Button>
                    </Box>
                </form>

                {/* Demo credentials (solo en desarrollo) */}
                {process.env.NODE_ENV === 'development' && (
                    <>
                        <Divider sx={{ my: 3 }}>
                            <Typography variant="body2" color="textSecondary">
                                Credenciales de Demo
                            </Typography>
                        </Divider>

                        <Box display="flex" gap={1} justifyContent="center" mb={3}>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => fillDemoCredentials('admin')}
                            >
                                Admin
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => fillDemoCredentials('abogado')}
                            >
                                Abogado
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => fillDemoCredentials('asistente')}
                            >
                                Asistente
                            </Button>
                        </Box>
                    </>
                )}

                <Box textAlign="center">
                    <Typography variant="body2" color="textSecondary">
                        ¿Problemas para ingresar?{' '}
                        <Link to="/contact" style={{ textDecoration: 'none' }}>
                            <Typography
                                component="span"
                                color="primary"
                                sx={{ cursor: 'pointer' }}
                            >
                                Contactar soporte
                            </Typography>
                        </Link>
                    </Typography>
                </Box>
            </LoginPaper>

            {/* Información del sistema */}
            <Box position="absolute" bottom={16} color="white">
                <Typography variant="caption" align="center">
                    v{process.env.REACT_APP_VERSION} • Sistema seguro de gestión documental
                </Typography>
            </Box>
        </LoginContainer>
    );
};

export default Login;
