import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';
import webSocketService from '../services/websocket';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        // Verificar token al cargar
        if (token) {
            verifyToken();
        } else {
            setLoading(false);
        }
    }, []);

    const verifyToken = async () => {
        try {
            const response = await authService.verifyToken();
            setUser(response.data.user);

            // Conectar WebSocket
            if (response.data.user) {
                webSocketService.connect(token, response.data.user.id);
            }
        } catch (error) {
            // Token inválido, limpiar
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        setLoading(true);
        try {
            const response = await authService.login(email, password);

            const { token, user } = response.data;

            // Guardar en localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // Actualizar estado
            setToken(token);
            setUser(user);

            // Conectar WebSocket
            webSocketService.connect(token, user.id);

            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || error.message || 'Error en login' };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Error en logout:', error);
        } finally {
            // Limpiar localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Desconectar WebSocket
            webSocketService.disconnect();

            // Actualizar estado
            setToken(null);
            setUser(null);
        }
    };

    const updateProfile = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const value = {
        user,
        token,
        loading,
        login,
        logout,
        updateProfile,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
