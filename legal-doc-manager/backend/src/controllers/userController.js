const User = require('../models/User');
const Log = require('../models/Log');
const { catchAsync } = require('../middleware/errorHandler');

// Obtener todos los usuarios (solo admin)
exports.getAllUsers = catchAsync(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await User.getAll(parseInt(limit), offset);

    res.json({
        success: true,
        data: result
    });
});

// Obtener usuario por ID
exports.getUserById = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Solo admin puede ver otros usuarios, o el propio usuario puede verse a sí mismo
    if (req.user.rol !== 'admin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({
            success: false,
            message: 'No tiene permisos para ver este usuario'
        });
    }

    const user = await User.findById(id);

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

// Crear nuevo usuario (solo admin)
exports.createUser = catchAsync(async (req, res) => {
    const { email, password, nombre, apellido, rol, permisos } = req.body;

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
        data: user
    });
});

// Actualizar usuario (solo admin o el propio usuario para algunos campos)
exports.updateUser = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Verificar permisos
    if (req.user.rol !== 'admin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({
            success: false,
            message: 'No tiene permisos para actualizar este usuario'
        });
    }

    // Determinar qué campos se pueden actualizar
    let updateData = { ...req.body };

    // Si no es admin, solo puede actualizar nombre y apellido
    if (req.user.rol !== 'admin') {
        updateData = {
            nombre: req.body.nombre,
            apellido: req.body.apellido
        };

        // Eliminar campos nulos
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });
    }

    const updatedUser = await User.update(id, updateData);

    // Registrar actividad
    await Log.record({
        usuario_id: req.user.id,
        accion: 'actualizar',
        detalles: `Usuario actualizado: ${updatedUser.email}`,
        direccion_ip: req.ip,
        user_agent: req.get('user-agent')
    });

    res.json({
        success: true,
        message: 'Usuario actualizado exitosamente',
        data: updatedUser
    });
});

// Desactivar/Activar usuario (solo admin)
exports.toggleUserStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { activo } = req.body;

    const user = await User.findById(id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'Usuario no encontrado'
        });
    }

    // No permitir desactivarse a sí mismo
    if (req.user.id === parseInt(id)) {
        return res.status(400).json({
            success: false,
            message: 'No puede desactivar su propia cuenta'
        });
    }

    await User.update(id, { activo: activo === undefined ? !user.activo : activo });

    // Registrar actividad
    await Log.record({
        usuario_id: req.user.id,
        accion: 'actualizar',
        detalles: `Usuario ${activo ? 'activado' : 'desactivado'}: ${user.email}`,
        direccion_ip: req.ip,
        user_agent: req.get('user-agent')
    });

    res.json({
        success: true,
        message: `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`
    });
});

// Resetear contraseña (solo admin)
exports.resetPassword = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    await User.resetPassword(id, newPassword);

    // Registrar actividad
    await Log.record({
        usuario_id: req.user.id,
        accion: 'actualizar',
        detalles: `Contraseña reseteada para usuario ${id}`,
        direccion_ip: req.ip,
        user_agent: req.get('user-agent')
    });

    res.json({
        success: true,
        message: 'Contraseña reseteada exitosamente'
    });
});
