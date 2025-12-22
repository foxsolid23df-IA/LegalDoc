import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Switch,
    FormControlLabel,
    Button,
    Divider,
    Grid,
} from '@mui/material';

const Settings = () => {
    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" mb={3}>
                Configuración del Sistema
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Notificaciones
                        </Typography>
                        <Divider sx={{ mb: 3 }} />

                        <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="Notificaciones por email"
                        />
                        <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="Notificaciones en la aplicación"
                        />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Settings;
