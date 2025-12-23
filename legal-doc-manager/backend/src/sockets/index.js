const socketIo = require('socket.io');
const getDatabase = require('../models/database');

let io = null;
const userSockets = new Map(); // userId -> socketId

function initialize(server) {
    io = socketIo(server, {
        cors: {
            origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:3000',
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('Nueva conexión Socket.io:', socket.id);

        // Autenticar usuario
        socket.on('authenticate', (userId) => {
            if (userId) {
                userSockets.set(userId, socket.id);
                socket.userId = userId;
                console.log(`Usuario ${userId} autenticado en socket ${socket.id}`);
            }
        });

        // Unirse a sala de documento
        socket.on('join-document', (documentId) => {
            socket.join(`document-${documentId}`);
            console.log(`Socket ${socket.id} unido a documento ${documentId}`);
        });

        // Salir de sala de documento
        socket.on('leave-document', (documentId) => {
            socket.leave(`document-${documentId}`);
            console.log(`Socket ${socket.id} salió de documento ${documentId}`);
        });

        // Notificar apertura de documento
        socket.on('document-opened', async ({ documentId, userId, userName }) => {
            try {
                const db = getDatabase();

                // Obtener información del usuario
                const user = await db.get(
                    'SELECT nombre, apellido FROM usuarios WHERE id = ?',
                    [userId]
                );

                // Notificar a otros usuarios en la sala
                socket.to(`document-${documentId}`).emit('document-being-used', {
                    documentId,
                    userId,
                    userName: user ? `${user.nombre} ${user.apellido}` : userName,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error('Error notificando apertura de documento:', error);
            }
        });

        // Notificar cambios en tiempo real
        socket.on('document-changes', ({ documentId, changes, userId }) => {
            socket.to(`document-${documentId}`).emit('document-updated', {
                documentId,
                changes,
                userId,
                timestamp: new Date().toISOString()
            });
        });

        // Notificar cierre de documento
        socket.on('document-closed', ({ documentId, userId }) => {
            socket.to(`document-${documentId}`).emit('document-freed', {
                documentId,
                userId,
                timestamp: new Date().toISOString()
            });
        });

        // Ping/pong para mantener conexión
        socket.on('ping', (callback) => {
            if (typeof callback === 'function') {
                callback('pong');
            }
        });

        // Desconexión
        socket.on('disconnect', () => {
            if (socket.userId) {
                userSockets.delete(socket.userId);
            }
            console.log('Socket desconectado:', socket.id);
        });
    });

    console.log('Socket.io inicializado');
}

// Enviar notificación a usuario específico
function notifyUser(userId, event, data) {
    const socketId = userSockets.get(userId);
    if (socketId && io) {
        io.to(socketId).emit(event, data);
    }
}

// Notificar a todos los usuarios en una sala de documento
function notifyDocumentRoom(documentId, event, data) {
    if (io) {
        io.to(`document-${documentId}`).emit(event, data);
    }
}

// Obtener usuarios conectados a un documento
function getDocumentUsers(documentId) {
    if (!io) return [];

    const room = io.sockets.adapter.rooms.get(`document-${documentId}`);
    if (!room) return [];

    return Array.from(room);
}

module.exports = {
    initialize,
    notifyUser,
    notifyDocumentRoom,
    getDocumentUsers,
    io: () => io
};
