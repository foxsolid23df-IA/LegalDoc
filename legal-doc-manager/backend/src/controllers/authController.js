const User = require('../models/User');
const Log = require('../models/Log');
const { generateToken } = require('../middleware/auth');
const { catchAsync } = require('../middleware/errorHandler');
const { logSecurityEvent } = require('../utils/logger');

// Registrar nuevo usuario (solo admin)
exports.register = catchAsync(async (req, res) => {
    const { email, password, nombre, apellido, rol, permisos } = req.body;

    // Verificar que el usuario que realiza la acción es admin
    if (req.user.rol !== 'admin') {
        logSecurityEvent({
            type: 'unauthorized_user_creation',
            userId: req.user.id,
            ipAddress: req.ip,
            details: `Intento de crear usuario sin permisos de admin`,
            severity: 'high'
        });

        return res.status(403).json({
            success: false,
            message: 'Solo los administradores pueden crear usuarios'
        });
    }

    // Crear usuario
    const user = await User.create({
        email,
        password,
        nombre,
        apellido,
        rol: rol || 'abogado',
        permisos: permisos || 'lectura'
    });

    // Registrar actividad
    await Log.record({
        usuario_id: req.user.id,
        accion: 'crear',
        detalles: `Usuario creado: ${email}`,
        direccion_ip: req.ip,
        user_agent: req.get('user-agent')
    });

    res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: {
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            apellido: user.apellido,
            rol: user.rol,
            permisos: user.permisos
        }
    });
});

// Iniciar sesión
exports.login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    // Buscar usuario
    const user = await User.findByEmail(email);

    if (!user) {
        logSecurityEvent({
            type: 'failed_login',
            ipAddress,
            details: `Intento de login con email no registrado: ${email}`,
            severity: 'low'
        });

        return res.status(401).json({
            success: false,
            message: 'Credenciales inválidas'
        });
    }

    // Verificar si el usuario está activo
    if (!user.activo) {
        return res.status(403).json({
            success: false,
            message: 'La cuenta está desactivada'
        });
    }

    // Verificar si el usuario está bloqueado
    const blockedUntil = await User.isUserBlocked(user.id);
    if (blockedUntil) {
        return res.status(403).json({
            success: false,
            message: `Cuenta bloqueada temporalmente. Intente nuevamente después de ${new Date(blockedUntil).toLocaleString()}`
        });
    }

    // Verificar contraseña
    const isValidPassword = await User.verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
        // Registrar intento fallido
        await User.recordLoginAttempt(user.id, false, ipAddress);

        logSecurityEvent({
            type: 'failed_login',
            userId: user.id,
            ipAddress,
            details: 'Contraseña incorrecta',
            severity: 'medium'
        });

        // Verificar si el usuario quedó bloqueado después del intento fallido
        const nowBlockedUntil = await User.isUserBlocked(user.id);
        if (nowBlockedUntil) {
            return res.status(403).json({
                success: false,
                message: `Demasiados intentos fallidos. Cuenta bloqueada hasta ${new Date(nowBlockedUntil).toLocaleString()}`
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Credenciales inválidas'
        });
    }

    // Actualizar último acceso
    await User.updateLastAccess(user.id, ipAddress);

    // Generar token JWT
    const token = generateToken(user.id);

    // Registrar login exitoso
    await Log.record({
        usuario_id: user.id,
        accion: 'login',
        detalles: 'Inicio de sesión exitoso',
        direccion_ip: ipAddress,
        user_agent: userAgent
    });

    res.json({
        success: true,
        message: 'Login exitoso',
        data: {
            token,
            user: {
                id: user.id,
                email: user.email,
                nombre: user.nombre,
                apellido: user.apellido,
                rol: user.rol,
                permisos: user.permisos
            }
        }
    });
});

// Cerrar sesión
exports.logout = catchAsync(async (req, res) => {
    const Document = require('../models/Document');

    // Liberar todos los documentos bloqueados por este usuario
    await Document.unlockAllUserDocuments(req.user.id);

    // Registrar logout
    await Log.record({
        usuario_id: req.user.id,
        accion: 'logout',
        detalles: 'Cierre de sesión',
        direccion_ip: req.ip,
        user_agent: req.get('user-agent')
    });

    res.json({
        success: true,
        message: 'Logout exitoso'
    });
});

// Obtener perfil de usuario actual
exports.getProfile = catchAsync(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'Usuario no encontrado'
        });
    }

    res.json({
        success: true,
        data: user
    });
});

// Actualizar perfil
exports.updateProfile = catchAsync(async (req, res) => {
    const { nombre, apellido } = req.body;

    // Solo permitir actualizar nombre y apellido
    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (apellido) updateData.apellido = apellido;

    const updatedUser = await User.update(req.user.id, updateData);

    // Registrar actividad
    await Log.record({
        usuario_id: req.user.id,
        accion: 'actualizar',
        detalles: 'Perfil actualizado',
        direccion_ip: req.ip,
        user_agent: req.get('user-agent')
    });

    res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: updatedUser
    });
});

// Cambiar contraseña
exports.changePassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    await User.changePassword(req.user.id, currentPassword, newPassword);

    // Registrar actividad
    await Log.record({
        usuario_id: req.user.id,
        accion: 'actualizar',
        detalles: 'Contraseña cambiada',
        direccion_ip: req.ip,
        user_agent: req.get('user-agent')
    });

    res.json({
        success: true,
        message: 'Contraseña cambiada exitosamente'
    });
});

// Verificar token (para mantener sesión activa)
exports.verifyToken = catchAsync(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'Usuario no encontrado'
        });
    }

    res.json({
        success: true,
        data: {
            user: {
                id: user.id,
                email: user.email,
                nombre: user.nombre,
                apellido: user.apellido,
                rol: user.rol,
                permisos: user.permisos
            }
        }
    });
});
