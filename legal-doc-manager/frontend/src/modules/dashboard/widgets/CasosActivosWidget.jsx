import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    LinearProgress,
    Box,
    Chip,
    Button
} from '@mui/material';
import { Gavel, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const CasosActivosWidget = ({ casos }) => {
    const navigate = useNavigate();

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight="bold">
                        Casos Activos
                    </Typography>
                    <Button
                        size="small"
                        endIcon={<ArrowForward />}
                        onClick={() => navigate('/cases')}
                    >
                        Ver Todos
                    </Button>
                </Box>

                {!casos || casos.length === 0 ? (
                    <Typography color="textSecondary">No hay casos activos recientes.</Typography>
                ) : (
                    <List>
                        {casos.map((caso) => (
                            <ListItem
                                key={caso.id}
                                button
                                onClick={() => navigate(`/unidades-casos/${caso.id}`)}
                                sx={{
                                    border: '1px solid #eee',
                                    borderRadius: 2,
                                    mb: 1,
                                    '&:hover': { bgcolor: '#f5f5f5' }
                                }}
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: 'primary.light' }}>
                                        <Gavel />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Typography variant="subtitle1" fontWeight="medium">
                                                {caso.nombre}
                                            </Typography>
                                            <Chip
                                                label={caso.codigo}
                                                size="small"
                                                variant="outlined"
                                                color="primary"
                                                sx={{ fontSize: '0.7rem', height: 20 }}
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        <Box mt={1}>
                                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                                                <Typography variant="caption" color="textSecondary">
                                                    Progreso
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {caso.porcentaje}%
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={caso.porcentaje}
                                                sx={{ height: 6, borderRadius: 3 }}
                                            />
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </CardContent>
        </Card>
    );
};

export default CasosActivosWidget;
