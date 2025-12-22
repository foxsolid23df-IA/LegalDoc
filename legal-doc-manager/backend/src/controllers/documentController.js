const Document = require('../models/Document');
const Log = require('../models/Log');
const fileHandler = require('../utils/fileHandler');
const { catchAsync } = require('../middleware/errorHandler');
const { notifyDocumentRoom } = require('../utils/socket');
const path = require('path');
const fs = require('fs').promises;

// Subir nuevo documento
exports.uploadDocument = catchAsync(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No se proporcionó ningún archivo'
        });
    }

    const {
        nombre_original,
        tipo_documento,
        confidencialidad,
        caso_id
    } = req.body;

    // Procesar archivo
    const fileInfo = await fileHandler.processUploadedFile(
        req.file.path,
        req.user.id,
        {
            nombre_original: nombre_original || req.file.originalname
        }
    );

    // Crear registro en base de datos
    const document = await Document.create({
        nombre_archivo: fileInfo.nombre_archivo,
        nombre_original: nombre_original || req.file.originalname,
        ruta_fisica: fileInfo.ruta_fisica,
        caso_id: caso_id || null,
        tipo_documento: tipo_documento || 'otro',
        extension: fileInfo.extension,
        tamaño_bytes: fileInfo.tamaño_bytes,
        confidencialidad: confidencialidad || 3,
        usuario_propietario: req.user.id,
        hash_archivo: fileInfo.hash_archivo
    });

    // Registrar actividad
    const logId = await Log.record({
        usuario_id: req.user.id,
        documento_id: document.id,
        caso_id: caso_id || null,
        accion: 'subir',
        detalles: `Documento subido: ${nombre_original || req.file.originalname}`,
        direccion_ip: req.ip,
        user_agent: req.get('user-agent')
    });

    res.status(201).json({
        success: true,
        message: 'Documento subido exitosamente',
        data: {
            document,
            logId
        }
    });
});

// Obtener documento por ID
exports.getDocument = catchAsync(async (req, res) => {
    const { id } = req.params;

    const document = await Document.findById(id, req.user.id);

    if (!document) {
        return res.status(404).json({
            success: false,
            message: 'Documento no encontrado'
        });
    }

    // Iniciar sesión de trabajo
    const logId = await Log.startWorkSession(
        req.user.id,
        document.id,
        req.ip,
        req.get('user-agent')
    );

    // Notificar a otros usuarios vía WebSocket
    notifyDocumentRoom(document.id, 'document-opened', {
        documentId: document.id,
        userId: req.user.id,
        userName: `${req.user.nombre} ${req.user.apellido}`
    });

    res.json({
        success: true,
        data: {
            document,
            workSessionId: logId
        }
    });
});

// Bloquear documento para edición
exports.lockDocument = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Generar ID de sesión único
    const sessionId = `session_${Date.now()}_${req.user.id}`;

    await Document.lockDocument(id, req.user.id, sessionId, req.ip);

    // Registrar actividad
    await Log.record({
        usuario_id: req.user.id,
        documento_id: id,
        accion: 'editar',
        detalles: 'Documento bloqueado para edición',
        direccion_ip: req.ip,
        user_agent: req.get('user-agent')
    });

    // Notificar a otros usuarios
    notifyDocumentRoom(id, 'document-locked', {
        documentId: id,
        userId: req.user.id,
        userName: `${req.user.nombre} ${req.user.apellido}`
    });

    res.json({
        success: true,
        message: 'Documento bloqueado exitosamente',
        data: {
            sessionId
        }
    });
});

// Liberar documento
exports.unlockDocument = catchAsync(async (req, res) => {
    const { id } = req.params;

    const unlocked = await Document.unlockDocument(id, req.user.id);

    if (!unlocked) {
        return res.status(400).json({
            success: false,
            message: 'No se pudo liberar el documento'
        });
    }

    // Finalizar sesión de trabajo si existe
    if (req.body.workSessionId) {
        await Log.endWorkSession(req.body.workSessionId, req.body.cambios);
    }

    // Registrar actividad
    await Log.record({
        usuario_id: req.user.id,
        documento_id: id,
        accion: 'editar',
        detalles: 'Documento liberado',
        cambios: req.body.cambios || null,
        direccion_ip: req.ip,
        user_agent: req.get('user-agent')
    });

    // Notificar a otros usuarios
    notifyDocumentRoom(id, 'document-unlocked', {
        documentId: id,
        userId: req.user.id
    });

    res.json({
        success: true,
        message: 'Documento liberado exitosamente'
    });
});

// Descargar documento
exports.downloadDocument = catchAsync(async (req, res) => {
    const { id } = req.params;

    const document = await Document.findById(id, req.user.id);

    if (!document) {
        return res.status(404).json({
            success: false,
            message: 'Documento no encontrado'
        });
    }

    // Crear archivo temporal desencriptado
    const tempDir = path.join(__dirname, '../../uploads/temp');
    await fs.mkdir(tempDir, { recursive: true });

    const tempFilePath = path.join(tempDir, `download_${Date.now()}_${document.nombre_original}`);

    await fileHandler.getFileForReading(document.ruta_fisica, tempFilePath);

    // Registrar descarga
    await Log.record({
        usuario_id: req.user.id,
        documento_id: document.id,
        accion: 'descargar',
        detalles: `Documento descargado: ${document.nombre_original}`,
        direccion_ip: req.ip,
        user_agent: req.get('user-agent')
    });

    // Configurar headers para descarga
    const mimeType = fileHandler.getMimeType(path.extname(document.nombre_original));
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.nombre_original}"`);
    res.setHeader('Content-Length', (await fs.stat(tempFilePath)).size);

    // Enviar archivo
    const fileStream = fs.createReadStream(tempFilePath);
    fileStream.pipe(res);

    // Limpiar archivo temporal después de enviar
    fileStream.on('close', async () => {
        try {
            await fs.unlink(tempFilePath);
        } catch (error) {
            console.warn('Error eliminando archivo temporal:', error.message);
        }
    });
});

// Actualizar documento
exports.updateDocument = catchAsync(async (req, res) => {
    const { id } = req.params;

    const updatedDocument = await Document.update(id, req.body, req.user.id);

    res.json({
        success: true,
        message: 'Documento actualizado exitosamente',
        data: updatedDocument
    });
});

// Eliminar documento
exports.deleteDocument = catchAsync(async (req, res) => {
    const { id } = req.params;

    await Document.delete(id, req.user.id);

    // Registrar actividad
    await Log.record({
        usuario_id: req.user.id,
        documento_id: id,
        accion: 'eliminar',
        detalles: 'Documento eliminado',
        direccion_ip: req.ip,
        user_agent: req.get('user-agent')
    });

    res.json({
        success: true,
        message: 'Documento eliminado exitosamente'
    });
});

// Buscar documentos
exports.searchDocuments = catchAsync(async (req, res) => {
    const { q, tipo_documento, caso_id, fecha_desde, fecha_hasta, confidencialidad_max } = req.query;

    const filters = {};
    if (tipo_documento) filters.tipo_documento = tipo_documento;
    if (caso_id) filters.caso_id = caso_id;
    if (fecha_desde) filters.fecha_desde = fecha_desde;
    if (fecha_hasta) filters.fecha_hasta = fecha_hasta;
    if (confidencialidad_max) filters.confidencialidad_max = parseInt(confidencialidad_max);

    const documents = await Document.search(q, req.user.id, filters);

    res.json({
        success: true,
        data: documents
    });
});

// Obtener documentos por caso
exports.getDocumentsByCase = catchAsync(async (req, res) => {
    const { caseId } = req.params;
    const { tipo_documento, confidencialidad_max } = req.query;

    const filters = {};
    if (tipo_documento) filters.tipo_documento = tipo_documento;
    if (confidencialidad_max) filters.confidencialidad_max = parseInt(confidencialidad_max);

    const documents = await Document.findByCase(caseId, req.user.id, filters);

    res.json({
        success: true,
        data: documents
    });
});

// Obtener versiones de documento
exports.getDocumentVersions = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Verificar acceso al documento
    await Document.checkAccess(id, req.user.id);

    const versions = await Document.getVersions(id);

    res.json({
        success: true,
        data: versions
    });
});

// Compartir documento
exports.shareDocument = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { usuario_id, permisos, fecha_expiracion } = req.body;

    const shareId = await Document.share(id, {
        usuario_id,
        permisos,
        fecha_expiracion
    }, req.user.id);

    // Registrar actividad
    await Log.record({
        usuario_id: req.user.id,
        documento_id: id,
        accion: 'compartir',
        detalles: `Documento compartido con usuario ${usuario_id}`,
        direccion_ip: req.ip,
        user_agent: req.get('user-agent')
    });

    res.status(201).json({
        success: true,
        message: 'Documento compartido exitosamente',
        data: {
            shareId
        }
    });
});

// Obtener usuarios con acceso al documento
exports.getDocumentShares = catchAsync(async (req, res) => {
    const { id } = req.params;

    const sharedUsers = await Document.getSharedUsers(id);

    res.json({
        success: true,
        data: sharedUsers
    });
});

// Revocar acceso compartido
exports.revokeShare = catchAsync(async (req, res) => {
    const { id, userId } = req.params;

    await Document.revokeShare(id, userId);

    // Registrar actividad
    await Log.record({
        usuario_id: req.user.id,
        documento_id: id,
        accion: 'compartir',
        detalles: `Acceso revocado para usuario ${userId}`,
        direccion_ip: req.ip,
        user_agent: req.get('user-agent')
    });

    res.json({
        success: true,
        message: 'Acceso revocado exitosamente'
    });
});

// Obtener estado de bloqueo de documento
exports.getDocumentLockStatus = catchAsync(async (req, res) => {
    const { id } = req.params;

    const db = require('../models/database')();
    await db.connect();

    const lock = await db.get(
        `SELECT b.*, u.nombre, u.apellido 
     FROM bloqueos_documentos b
     JOIN usuarios u ON b.usuario_id = u.id
     WHERE b.documento_id = ?`,
        [id]
    );

    await db.close();

    res.json({
        success: true,
        data: {
            isLocked: !!lock,
            lockInfo: lock
        }
    });
});
