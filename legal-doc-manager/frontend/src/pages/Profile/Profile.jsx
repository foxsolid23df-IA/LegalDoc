import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Avatar,
    TextField,
    Button,
    Grid,
    Divider,
    Chip,
} from '@mui/material';
import { Person, Email, Phone, Edit } from '@mui/icons-material';

const Profile = () => {
    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" mb={3}>
                Mi Perfil
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Avatar sx={{ width: 120, height: 120, margin: '0 auto 20px', fontSize: 40 }}>
                            JS
                        </Avatar>
                        <Typography variant="h6" gutterBottom>
                            Juan Sánchez
                        </Typography>
                        <Chip label="Abogado" color="primary" sx={{ mb: 2 }} />
                        <Typography variant="body2" color="textSecondary">
                            Último acceso: Hoy, 10:30 AM
                        </Typography>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Información Personal
                        </Typography>
                        <Divider sx={{ mb: 3 }} />

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Nombre" defaultValue="Juan" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Apellido" defaultValue="Sánchez" />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="Email" defaultValue="juan@legal.com" />
                            </Grid>
                            <Grid item xs={12}>
                                <Button variant="contained" startIcon={<Edit />}>
                                    Actualizar Perfil
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Profile;
