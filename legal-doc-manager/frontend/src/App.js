import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

// Layout
import Layout from './components/Layout/Layout';

// Páginas - Lazy loading para mejor rendimiento
const Login = React.lazy(() => import('./pages/Login/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard/Dashboard'));
const DocumentList = React.lazy(() => import('./pages/Documents/DocumentList'));
const DocumentUpload = React.lazy(() => import('./pages/Documents/DocumentUpload'));
const DocumentView = React.lazy(() => import('./pages/Documents/DocumentView'));
const DocumentEdit = React.lazy(() => import('./pages/Documents/DocumentEdit'));
const UserManagement = React.lazy(() => import('./pages/Users/UserManagement'));
const ActivityLogs = React.lazy(() => import('./pages/Logs/ActivityLogs'));
const Profile = React.lazy(() => import('./pages/Profile/Profile'));
const Cases = React.lazy(() => import('./pages/Cases/Cases'));
const Settings = React.lazy(() => import('./pages/Settings/Settings'));

// Componente de carga
const LoadingFallback = () => (
    <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
    >
        <CircularProgress />
    </Box>
);

function App() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <Routes>
                {/* Rutas públicas */}
                <Route path="/login" element={<Login />} />

                {/* Rutas protegidas con Layout */}
                <Route path="/" element={<Layout />}>
                    <Route index element={<Navigate to="/dashboard" />} />
                    <Route path="dashboard" element={<Dashboard />} />

                    {/* Documentos */}
                    <Route path="documents" element={<DocumentList />} />
                    <Route path="documents/upload" element={<DocumentUpload />} />
                    <Route path="documents/:id" element={<DocumentView />} />
                    <Route path="documents/:id/edit" element={<DocumentEdit />} />

                    {/* Casos */}
                    <Route path="cases" element={<Cases />} />

                    {/* Usuarios (solo admin) */}
                    <Route path="users" element={<UserManagement />} />

                    {/* Logs */}
                    <Route path="logs" element={<ActivityLogs />} />

                    {/* Perfil */}
                    <Route path="profile" element={<Profile />} />

                    {/* Configuración */}
                    <Route path="settings" element={<Settings />} />
                </Route>

                {/* Ruta 404 */}
                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
        </Suspense>
    );
}

export default App;
