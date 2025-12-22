const Log = require('../models/Log');
const { catchAsync } = require('../middleware/errorHandler');

// Obtener logs de actividad
exports.getActivityLogs = catchAsync(async (req, res) => {
    const {
        page = 1,
        limit = 50,
        userId,
        documentId,
        caseId,
        action,
        startDate,
        endDate
    } = req.query;

    const offset = (page - 1) * limit;
    const db = require('../models/database')();
    await db.connect();

    // Construir consulta dinámica
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 0;

    if (userId) {
        whereClause += ' AND usuario_id = ?';
        params[paramIndex++] = userId;
    }

    if (documentId) {
        whereClause += ' AND documento_id = ?';
        params[paramIndex++] = documentId;
    }

    if (caseId) {
        whereClause += ' AND caso_id = ?';
        params[paramIndex++] = caseId;
    }

    if (action) {
        whereClause += ' AND accion = ?';
        params[paramIndex++] = action;
    }

    if (startDate) {
        whereClause += ' AND fecha_registro >= ?';
        params[paramIndex++] = startDate;
    }

    if (endDate) {
        whereClause += ' AND fecha_registro <= ?';
        params[paramIndex++] = endDate;
    }

    // Solo admin puede ver todos los logs, otros usuarios solo pueden ver sus propios logs
    if (req.user.rol !== 'admin' && !userId) {
        whereClause += ' AND usuario_id = ?';
        params[paramIndex++] = req.user.id;
    }

    // Obtener logs
    const logs = await db.all(
        `SELECT l.*, 
            u.nombre, u.apellido, u.email,
            d.nombre_original as documento_nombre,
            c.numero_caso, c.titulo as caso_titulo
     FROM logs_actividad l
     LEFT JOIN usuarios u ON l.usuario_id = u.id
     LEFT JOIN documentos d ON l.documento_id = d.id
     LEFT JOIN casos c ON l.caso_id = c.id
     ${whereClause}
     ORDER BY l.fecha_registro DESC
     LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
    );

    // Obtener total
    const totalResult = await db.get(
        `SELECT COUNT(*) as count 
     FROM logs_actividad l
     ${whereClause}`,
        params
    );

    await db.close();

    res.json({
        success: true,
        data: {
            logs,
            total: totalResult.count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(totalResult.count / limit)
        }
    });
});

// Obtener estadísticas de trabajo
exports.getWorkStatistics = catchAsync(async (req, res) => {
    const { userId, startDate, endDate } = req.query;

    // Solo admin puede ver estadísticas de otros usuarios
    const targetUserId = req.user.rol === 'admin' && userId ? userId : req.user.id;

    // Fechas por defecto: últimos 30 días
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const stats = await Log.getWorkStatistics(
        targetUserId,
        startDate || defaultStartDate.toISOString().split('T')[0],
        endDate || new Date().toISOString().split('T')[0]
    );

    res.json({
        success: true,
        data: stats
    });
});

// Obtener actividad reciente
exports.getRecentActivity = catchAsync(async (req, res) => {
    const { limit = 50 } = req.query;

    let activities;

    if (req.user.rol === 'admin') {
        // Admin ve toda la actividad
        activities = await Log.getRecentActivity(parseInt(limit));
    } else {
        // Usuarios normales solo ven su actividad
        const db = require('../models/database')();
        await db.connect();

        activities = await db.all(
            `SELECT l.*, 
              u.nombre, u.apellido, u.email,
              d.nombre_original as documento_nombre,
              c.numero_caso, c.titulo as caso_titulo
       FROM logs_actividad l
       LEFT JOIN usuarios u ON l.usuario_id = u.id
       LEFT JOIN documentos d ON l.documento_id = d.id
       LEFT JOIN casos c ON l.caso_id = c.id
       WHERE l.usuario_id = ?
       ORDER BY l.fecha_registro DESC
       LIMIT ?`,
            [req.user.id, parseInt(limit)]
        );

        await db.close();
    }

    res.json({
        success: true,
        data: activities
    });
});

// Obtener logs por documento
exports.getDocumentLogs = catchAsync(async (req, res) => {
    const { documentId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Verificar acceso al documento
    const Document = require('../models/Document');
    await Document.checkAccess(documentId, req.user.id);

    const result = await Log.getByDocument(documentId, parseInt(limit), offset);

    res.json({
        success: true,
        data: result
    });
});

// Obtener logs por usuario
exports.getUserLogs = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Solo admin puede ver logs de otros usuarios
    if (req.user.rol !== 'admin' && req.user.id !== parseInt(userId)) {
        return res.status(403).json({
            success: false,
            message: 'No tiene permisos para ver los logs de este usuario'
        });
    }

    const result = await Log.getByUser(userId, parseInt(limit), offset);

    res.json({
        success: true,
        data: result
    });
});
