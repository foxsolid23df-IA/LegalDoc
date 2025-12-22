const getDatabase = require('./database');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const moment = require('moment');

class Document {
    // Crear registro de documento
    static async create(documentData) {
        const db = getDatabase();
        const {
            nombre_archivo,
            nombre_original,
            ruta_fisica,
            caso_id,
            tipo_documento,
            extension,
            tamaño_bytes,
            confidencialidad = 3,
            usuario_propietario,
            hash_archivo
        } = documentData;

        try {
            const result = await db.run(
                `INSERT INTO documentos (
          nombre_archivo, nombre_original, ruta_fisica, caso_id, tipo_documento,
          extension, tamaño_bytes, confidencialidad, usuario_propietario, hash_archivo,
          fecha_modificacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
                [
                    nombre_archivo,
                    nombre_original,
                    ruta_fisica,
                    caso_id || null,
                    tipo_documento,
                    extension,
                    tamaño_bytes,
                    confidencialidad,
                    usuario_propietario,
                    hash_archivo
                ]
            );

            // Crear versión inicial
            await this.createVersion({
                documento_id: result.id,
                version: 1,
                usuario_id: usuario_propietario,
                ruta_fisica,
                hash_version: hash_archivo,
                comentario: 'Versión inicial'
            });

            return await this.findById(result.id);
        } catch (error) {
            throw error;
        }
    }

    // Buscar documento por ID
    static async findById(id, userId = null) {
        const db = getDatabase();
        try {
            let document = await db.get(
                `SELECT d.*, 
                u.nombre as propietario_nombre, u.apellido as propietario_apellido,
                c.numero_caso, c.titulo as caso_titulo,
                b.usuario_id as bloqueado_por, 
                ub.nombre as bloqueado_nombre, ub.apellido as bloqueado_apellido
         FROM documentos d
         LEFT JOIN usuarios u ON d.usuario_propietario = u.id
         LEFT JOIN casos c ON d.caso_id = c.id
         LEFT JOIN bloqueos_documentos b ON d.id = b.documento_id
         LEFT JOIN usuarios ub ON b.usuario_id = ub.id
         WHERE d.id = ?`,
                [id]
            );

            if (!document) {
                return null;
            }

            // Verificar permisos de acceso
            if (userId && document.usuario_propietario !== userId) {
                const tieneAcceso = await this.checkAccess(id, userId);
                if (!tieneAcceso) {
                    throw new Error('No tiene permisos para acceder a este documento');
                }
            }

            return document;
        } catch (error) {
            throw error;
        }
    }

    // Verificar acceso al documento
    static async checkAccess(documentId, userId) {
        const db = getDatabase();
        try {
            // Verificar si es propietario
            const document = await db.get(
                'SELECT usuario_propietario FROM documentos WHERE id = ?',
                [documentId]
            );

            if (!document) {
                throw new Error('Documento no encontrado');
            }

            if (document.usuario_propietario === userId) {
                return true;
            }

            // Verificar si está compartido
            const shared = await db.get(
                `SELECT permisos FROM compartir_documentos 
         WHERE documento_id = ? AND usuario_id = ? AND activo = 1
         AND (fecha_expiracion IS NULL OR fecha_expiracion > CURRENT_TIMESTAMP)`,
                [documentId, userId]
            );

            return !!shared;
        } catch (error) {
            throw error;
        }
    }

    // Bloquear documento
    static async lockDocument(documentId, userId, sessionId, ipAddress) {
        const db = getDatabase();

        try {
            // Verificar si ya está bloqueado
            const existingLock = await db.get(
                'SELECT usuario_id, fecha_bloqueo FROM bloqueos_documentos WHERE documento_id = ?',
                [documentId]
            );

            if (existingLock) {
                // Verificar si el bloqueo es antiguo (más de 30 minutos)
                const lockTime = new Date(existingLock.fecha_bloqueo);
                const now = new Date();
                const minutesDiff = (now - lockTime) / (1000 * 60);

                if (minutesDiff > 30) {
                    // Eliminar bloqueo antiguo
                    await db.run('DELETE FROM bloqueos_documentos WHERE documento_id = ?', [documentId]);
                } else if (existingLock.usuario_id !== userId) {
                    throw new Error(`Documento bloqueado por otro usuario (ID: ${existingLock.usuario_id})`);
                } else {
                    // Ya está bloqueado por el mismo usuario, actualizar
                    await db.run(
                        'UPDATE bloqueos_documentos SET fecha_bloqueo = CURRENT_TIMESTAMP WHERE documento_id = ?',
                        [documentId]
                    );
                    return true;
                }
            }

            // Crear nuevo bloqueo
            await db.run(
                `INSERT INTO bloqueos_documentos (documento_id, usuario_id, direccion_ip, sesion_id)
         VALUES (?, ?, ?, ?)`,
                [documentId, userId, ipAddress, sessionId]
            );

            return true;
        } catch (error) {
            throw error;
        }
    }

    // Liberar documento
    static async unlockDocument(documentId, userId) {
        const db = getDatabase();

        try {
            const result = await db.run(
                'DELETE FROM bloqueos_documentos WHERE documento_id = ? AND usuario_id = ?',
                [documentId, userId]
            );

            return result.changes > 0;
        } catch (error) {
            throw error;
        }
    }

    // Liberar todos los bloqueos de un usuario (logout o timeout)
    static async unlockAllUserDocuments(userId) {
        const db = getDatabase();

        try {
            await db.run(
                'DELETE FROM bloqueos_documentos WHERE usuario_id = ?',
                [userId]
            );

            return true;
        } catch (error) {
            throw error;
        }
    }

    // Obtener documentos por caso
    static async findByCase(casoId, userId, filters = {}) {
        const db = getDatabase();

        try {
            let whereClause = 'WHERE d.caso_id = ?';
            const params = [casoId];
            let paramIndex = 1;

            // Aplicar filtros
            if (filters.tipo_documento) {
                whereClause += ` AND d.tipo_documento = ?`;
                params[paramIndex++] = filters.tipo_documento;
            }

            if (filters.confidencialidad_max) {
                whereClause += ` AND d.confidencialidad <= ?`;
                params[paramIndex++] = filters.confidencialidad_max;
            }

            const documents = await db.all(
                `SELECT d.*, 
                u.nombre as propietario_nombre, u.apellido as propietario_apellido,
                b.usuario_id as bloqueado_por
         FROM documentos d
         LEFT JOIN usuarios u ON d.usuario_propietario = u.id
         LEFT JOIN bloqueos_documentos b ON d.id = b.documento_id
         ${whereClause}
         ORDER BY d.fecha_upload DESC`,
                params
            );

            // Filtrar documentos a los que el usuario tiene acceso
            const accessibleDocuments = [];
            for (const doc of documents) {
                try {
                    await this.checkAccess(doc.id, userId);
                    accessibleDocuments.push(doc);
                } catch (error) {
                    // Saltar documentos sin acceso
                }
            }

            return accessibleDocuments;
        } catch (error) {
            throw error;
        }
    }

    // Buscar documentos
    static async search(query, userId, filters = {}) {
        const db = getDatabase();

        try {
            let whereClause = 'WHERE 1=1';
            const params = [];
            let paramIndex = 0;

            // Buscar en nombre y contenido (si implementado)
            if (query) {
                whereClause += ` AND (d.nombre_original LIKE ? OR d.nombre_archivo LIKE ?)`;
                const searchTerm = `%${query}%`;
                params[paramIndex++] = searchTerm;
                params[paramIndex++] = searchTerm;
            }

            // Aplicar filtros
            if (filters.tipo_documento) {
                whereClause += ` AND d.tipo_documento = ?`;
                params[paramIndex++] = filters.tipo_documento;
            }

            if (filters.caso_id) {
                whereClause += ` AND d.caso_id = ?`;
                params[paramIndex++] = filters.caso_id;
            }

            if (filters.fecha_desde) {
                whereClause += ` AND d.fecha_upload >= ?`;
                params[paramIndex++] = filters.fecha_desde;
            }

            if (filters.fecha_hasta) {
                whereClause += ` AND d.fecha_upload <= ?`;
                params[paramIndex++] = filters.fecha_hasta;
            }

            const documents = await db.all(
                `SELECT d.*, 
                u.nombre as propietario_nombre, u.apellido as propietario_apellido,
                c.numero_caso, c.titulo as caso_titulo,
                b.usuario_id as bloqueado_por
         FROM documentos d
         LEFT JOIN usuarios u ON d.usuario_propietario = u.id
         LEFT JOIN casos c ON d.caso_id = c.id
         LEFT JOIN bloqueos_documentos b ON d.id = b.documento_id
         ${whereClause}
         ORDER BY d.fecha_upload DESC
         LIMIT 100`,
                params
            );

            // Filtrar por acceso
            const accessibleDocuments = [];
            for (const doc of documents) {
                try {
                    await this.checkAccess(doc.id, userId);
                    accessibleDocuments.push(doc);
                } catch (error) {
                    // Saltar documentos sin acceso
                }
            }

            return accessibleDocuments;
        } catch (error) {
            throw error;
        }
    }

    // Actualizar documento
    static async update(documentId, updateData, userId) {
        const db = getDatabase();

        try {
            // Verificar acceso y bloqueo
            await this.checkAccess(documentId, userId);

            const lock = await db.get(
                'SELECT usuario_id FROM bloqueos_documentos WHERE documento_id = ?',
                [documentId]
            );

            if (!lock || lock.usuario_id !== userId) {
                throw new Error('Debe bloquear el documento antes de editarlo');
            }

            // Obtener documento actual
            const currentDoc = await this.findById(documentId);

            // Actualizar
            const allowedFields = ['nombre_original', 'tipo_documento', 'confidencialidad', 'caso_id'];
            const updateFields = [];
            const values = [];

            for (const [field, value] of Object.entries(updateData)) {
                if (allowedFields.includes(field)) {
                    updateFields.push(`${field} = ?`);
                    values.push(value);
                }
            }

            if (updateFields.length === 0) {
                throw new Error('No hay campos válidos para actualizar');
            }

            updateFields.push('fecha_modificacion = CURRENT_TIMESTAMP');
            values.push(documentId);

            const sql = `UPDATE documentos SET ${updateFields.join(', ')} WHERE id = ?`;
            await db.run(sql, values);

            return await this.findById(documentId);
        } catch (error) {
            throw error;
        }
    }

    // Eliminar documento (soft delete)
    static async delete(documentId, userId) {
        const db = getDatabase();

        try {
            // Verificar permisos (solo propietario o admin)
            const document = await this.findById(documentId);
            if (!document) {
                throw new Error('Documento no encontrado');
            }

            // Obtener usuario para verificar si es admin
            const user = await db.get(
                'SELECT rol FROM usuarios WHERE id = ?',
                [userId]
            );

            if (document.usuario_propietario !== userId && user.rol !== 'admin') {
                throw new Error('No tiene permisos para eliminar este documento');
            }

            // Eliminar bloqueos primero
            await db.run('DELETE FROM bloqueos_documentos WHERE documento_id = ?', [documentId]);

            // Eliminar compartidos
            await db.run('DELETE FROM compartir_documentos WHERE documento_id = ?', [documentId]);

            // Eliminar versiones
            await db.run('DELETE FROM versiones_documentos WHERE documento_id = ?', [documentId]);

            // Eliminar documento
            const result = await db.run('DELETE FROM documentos WHERE id = ?', [documentId]);

            // Eliminar archivo físico
            try {
                await fs.unlink(document.ruta_fisica);

                // Eliminar versiones físicas
                const versionsDir = path.join(path.dirname(document.ruta_fisica), 'versions');
                const versionFiles = await fs.readdir(versionsDir);

                for (const file of versionFiles) {
                    if (file.startsWith(`doc_${documentId}_`)) {
                        await fs.unlink(path.join(versionsDir, file));
                    }
                }
            } catch (fsError) {
                console.warn('No se pudo eliminar archivo físico:', fsError.message);
            }

            return result.changes > 0;
        } catch (error) {
            throw error;
        }
    }

    // Crear nueva versión
    static async createVersion(versionData) {
        const db = getDatabase();

        try {
            const result = await db.run(
                `INSERT INTO versiones_documentos (
          documento_id, version, usuario_id, ruta_fisica, 
          hash_version, comentario, cambios
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    versionData.documento_id,
                    versionData.version,
                    versionData.usuario_id,
                    versionData.ruta_fisica,
                    versionData.hash_version,
                    versionData.comentario || '',
                    versionData.cambios || '{}'
                ]
            );

            // Actualizar versión actual en documento
            await db.run(
                'UPDATE documentos SET version_actual = ? WHERE id = ?',
                [versionData.version, versionData.documento_id]
            );

            return result.id;
        } catch (error) {
            throw error;
        }
    }

    // Obtener versiones de un documento
    static async getVersions(documentId) {
        const db = getDatabase();

        try {
            const versions = await db.all(
                `SELECT v.*, u.nombre, u.apellido
         FROM versiones_documentos v
         LEFT JOIN usuarios u ON v.usuario_id = u.id
         WHERE v.documento_id = ?
         ORDER BY v.version DESC`,
                [documentId]
            );

            return versions;
        } catch (error) {
            throw error;
        }
    }

    // Compartir documento
    static async share(documentId, shareData, sharedBy) {
        const db = getDatabase();

        try {
            const result = await db.run(
                `INSERT INTO compartir_documentos (
          documento_id, usuario_id, permisos, compartido_por, fecha_expiracion
        ) VALUES (?, ?, ?, ?, ?)`,
                [
                    documentId,
                    shareData.usuario_id,
                    shareData.permisos || 'lectura',
                    sharedBy,
                    shareData.fecha_expiracion || null
                ]
            );

            return result.id;
        } catch (error) {
            // Si ya existe, actualizar
            if (error.message.includes('UNIQUE constraint failed')) {
                await db.run(
                    `UPDATE compartir_documentos 
           SET permisos = ?, fecha_expiracion = ?, activo = 1
           WHERE documento_id = ? AND usuario_id = ?`,
                    [
                        shareData.permisos || 'lectura',
                        shareData.fecha_expiracion || null,
                        documentId,
                        shareData.usuario_id
                    ]
                );
                return 'updated';
            }
            throw error;
        }
    }

    // Obtener usuarios con acceso al documento
    static async getSharedUsers(documentId) {
        const db = getDatabase();

        try {
            const sharedUsers = await db.all(
                `SELECT cd.*, u.email, u.nombre, u.apellido, u.rol,
                uc.nombre as compartido_por_nombre, uc.apellido as compartido_por_apellido
         FROM compartir_documentos cd
         JOIN usuarios u ON cd.usuario_id = u.id
         LEFT JOIN usuarios uc ON cd.compartido_por = uc.id
         WHERE cd.documento_id = ? AND cd.activo = 1
         ORDER BY cd.fecha_compartir DESC`,
                [documentId]
            );

            return sharedUsers;
        } catch (error) {
            throw error;
        }
    }

    // Revocar acceso compartido
    static async revokeShare(documentId, userId) {
        const db = getDatabase();

        try {
            const result = await db.run(
                'UPDATE compartir_documentos SET activo = 0 WHERE documento_id = ? AND usuario_id = ?',
                [documentId, userId]
            );

            return result.changes > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Document;
