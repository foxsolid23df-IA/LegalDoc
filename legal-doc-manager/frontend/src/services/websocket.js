import io from 'socket.io-client';
import { toast } from 'react-hot-toast';

const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';

class WebSocketService {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
    }

    connect(token, userId) {
        if (this.socket?.connected) {
            return;
        }

        this.socket = io(WS_URL, {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        this.setupEventListeners(userId);
    }

    setupEventListeners(userId) {
        if (!this.socket) return;

        // Eventos del sistema
        this.socket.on('connect', () => {
            console.log('Conectado a WebSocket');

            // Autenticar usuario
            this.socket.emit('authenticate', userId);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Desconectado de WebSocket:', reason);

            if (reason === 'io server disconnect') {
                // Reconectar manualmente
                this.socket.connect();
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('Error de conexión WebSocket:', error.message);
        });

        // Eventos de documentos
        this.socket.on('document-being-used', (data) => {
            const { documentId, userName } = data;
            toast.info(`⚠️ ${userName} está viendo este documento`, {
                duration: 5000,
                id: `doc-${documentId}-in-use`
            });
        });

        this.socket.on('document-locked', (data) => {
            const { documentId, userName } = data;
            toast.warning(`🔒 ${userName} está editando este documento`, {
                duration: 6000,
                id: `doc-${documentId}-locked`
            });
        });

        this.socket.on('document-unlocked', (data) => {
            const { documentId } = data;
            toast.success('✅ Documento disponible para edición', {
                duration: 3000,
                id: `doc-${documentId}-unlocked`
            });
        });

        this.socket.on('document-updated', (data) => {
            const { documentId, changes, userName } = data;

            // Notificar cambios en tiempo real
            const event = new CustomEvent('document-updated', {
                detail: { documentId, changes, userName }
            });
            window.dispatchEvent(event);
        });

        // Eventos personalizados
        this.socket.on('notification', (data) => {
            const { type, message, severity = 'info' } = data;

            switch (severity) {
                case 'error':
                    toast.error(message);
                    break;
                case 'warning':
                    toast.warning(message);
                    break;
                case 'success':
                    toast.success(message);
                    break;
                default:
                    toast(message);
            }
        });
    }

    // Unirse a sala de documento
    joinDocument(documentId) {
        if (this.socket?.connected) {
            this.socket.emit('join-document', documentId);
        }
    }

    // Salir de sala de documento
    leaveDocument(documentId) {
        if (this.socket?.connected) {
            this.socket.emit('leave-document', documentId);
        }
    }

    // Notificar apertura de documento
    notifyDocumentOpened(documentId, userId, userName) {
        if (this.socket?.connected) {
            this.socket.emit('document-opened', { documentId, userId, userName });
        }
    }

    // Notificar cambios en documento
    notifyDocumentChanges(documentId, changes, userId) {
        if (this.socket?.connected) {
            this.socket.emit('document-changes', { documentId, changes, userId });
        }
    }

    // Notificar cierre de documento
    notifyDocumentClosed(documentId, userId) {
        if (this.socket?.connected) {
            this.socket.emit('document-closed', { documentId, userId });
        }
    }

    // Suscribirse a evento personalizado
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);

        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    // Desuscribirse de evento
    off(event, callback) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }

        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    // Desconectar
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.listeners.clear();
        }
    }

    // Verificar estado de conexión
    isConnected() {
        return this.socket?.connected || false;
    }
}

// Singleton
const webSocketService = new WebSocketService();
export default webSocketService;
