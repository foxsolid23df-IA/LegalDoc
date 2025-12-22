import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import { Box, Container, CircularProgress } from '@mui/material';

const Layout = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return (
        <Box display="flex" minHeight="100vh" bgcolor="grey.50">
            <Sidebar />
            <Box flex={1} display="flex" flexDirection="column">
                <Header />
                <Container maxWidth="xl" sx={{ py: 3, flex: 1 }}>
                    <Outlet />
                </Container>
            </Box>
        </Box>
    );
};

export default Layout;
