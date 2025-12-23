const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('../../models/User');
const { logSecurityEvent } = require('../../utils/logger');

dotenv.config();

// Middleware de autenticación
async function authenticate(req, res, next) {
    try {
        // Obtener token del header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Acceso no autorizado. Token requerido.'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verificar si el usuario existe y está activo
        const user = await User.findById(decoded.userId);

        if (!user || !user.activo) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado o inactivo.'
            });
        }

        // Verificar si el usuario está bloqueado
        const blockedUntil = await User.isUserBlocked(decoded.userId);
        if (blockedUntil) {
            return res.status(403).json({
                success: false,
                message: `Cuenta bloqueada hasta ${new Date(blockedUntil).toLocaleString()}.`
            });
        }

        // Adjuntar usuario a la request
        req.user = {
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            apellido: user.apellido,
            rol: user.rol,
            permisos: user.permisos
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            logSecurityEvent({
                type: 'invalid_token',
                ipAddress: req.ip,
                details: error.message
            });

            return res.status(401).json({
                success: false,
                message: 'Token inválido.'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado. Por favor inicie sesión nuevamente.'
            });
        }

        console.error('Error de autenticación:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor.'
        });
    }
}

// Middleware para verificar roles
function authorize(roles = []) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado.'
            });
        }

        if (roles.length && !roles.includes(req.user.rol)) {
            logSecurityEvent({
                type: 'unauthorized_access',
                userId: req.user.id,
                ipAddress: req.ip,
                details: `Intento de acceso a recurso restringido. Rol: ${req.user.rol}, Roles requeridos: ${roles.join(', ')}`,
                severity: 'high'
            });

            return res.status(403).json({
                success: false,
                message: 'No tiene permisos para acceder a este recurso.'
            });
        }

        next();
    };
}

// Middleware para verificar permisos específicos
function checkPermission(requiredPermission) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado.'
            });
        }

        const userPermissions = req.user.permisos;
        const permissionHierarchy = {
            'lectura': 1,
            'editor': 2,
            'full': 3
        };

        const userLevel = permissionHierarchy[userPermissions] || 0;
        const requiredLevel = permissionHierarchy[requiredPermission] || 0;

        if (userLevel < requiredLevel) {
            logSecurityEvent({
                type: 'insufficient_permissions',
                userId: req.user.id,
                ipAddress: req.ip,
                details: `Permiso insuficiente. Tiene: ${userPermissions}, Requerido: ${requiredPermission}`,
                severity: 'medium'
            });

            return res.status(403).json({
                success: false,
                message: `Permisos insuficientes. Se requiere: ${requiredPermission}`
            });
        }

        next();
    };
}

// Middleware para registrar actividad
function logActivity(action) {
    return async (req, res, next) => {
        const originalSend = res.send;

        res.send = function (data) {
            // Registrar después de enviar respuesta
            if (req.user) {
                const Log = require('../../models/Log');

                Log.record({
                    usuario_id: req.user.id,
                    documento_id: req.params.documentId || req.body.documentId,
                    caso_id: req.params.caseId || req.body.caseId,
                    accion: action,
                    detalles: JSON.stringify({
                        method: req.method,
                        url: req.originalUrl,
                        statusCode: res.statusCode
                    }),
                    direccion_ip: req.ip,
                    user_agent: req.get('user-agent')
                }).catch(err => {
                    console.error('Error registrando actividad:', err);
                });
            }

            return originalSend.call(this, data);
        };

        next();
    };
}

// Generar token JWT
function generateToken(userId) {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );
}

module.exports = {
    authenticate,
    authorize,
    checkPermission,
    logActivity,
    generateToken
};
