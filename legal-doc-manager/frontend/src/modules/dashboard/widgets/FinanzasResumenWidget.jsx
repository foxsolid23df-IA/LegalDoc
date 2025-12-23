import React from 'react';
import { Card, CardContent, Typography, Box, Divider, Stack } from '@mui/material';
import { TrendingUp, TrendingDown, AccountBalanceWallet } from '@mui/icons-material';

const FinanzasResumenWidget = ({ datos }) => {
    if (!datos) return null;

    const MetricRow = ({ icon, label, value, color }) => (
        <Box display="flex" justifyContent="space-between" alignItems="center" py={1.5}>
            <Box display="flex" alignItems="center" gap={1.5}>
                <Box
                    p={0.5}
                    borderRadius={1}
                    bgcolor={`${color}.light`}
                    color={`${color}.main`}
                    display="flex"
                >
                    {icon}
                </Box>
                <Typography variant="body2" color="textSecondary">
                    {label}
                </Typography>
            </Box>
            <Typography variant="subtitle1" fontWeight="bold">
                ${value.toLocaleString()}
            </Typography>
        </Box>
    );

    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Resumen Financiero
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block" mb={3}>
                    Balance general del mes actual
                </Typography>

                <Box bgcolor="primary.main" color="white" p={3} borderRadius={2} mb={3} textAlign="center">
                    <Typography variant="h3" fontWeight="bold">
                        ${datos.balance.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Balance Neto
                    </Typography>
                </Box>

                <Stack divider={<Divider flexItem />}>
                    <MetricRow
                        icon={<TrendingUp fontSize="small" />}
                        label="Ingresos Totales"
                        value={datos.ingresos}
                        color="success"
                    />
                    <MetricRow
                        icon={<TrendingDown fontSize="small" />}
                        label="Gastos Operativos"
                        value={datos.gastos}
                        color="error"
                    />
                </Stack>
            </CardContent>
        </Card>
    );
};

export default FinanzasResumenWidget;
