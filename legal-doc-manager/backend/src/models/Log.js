const getDatabase = require('./database');

class Log {
    // Registrar actividad
    static async record(activityData) {
        const db = getDatabase();

        try {
            const {
                usuario_id,
                documento_id = null,
                caso_id = null,
                accion,
                detalles = null,
                cambios = null,
                tiempo_inicio = null,
                tiempo_fin = null,
                duracion_segundos = null,
                direccion_ip = null,
                user_agent = null
            } = activityData;

            const result = await db.run(
                `INSERT INTO logs_actividad (
          usuario_id, documento_id, caso_id, accion, detalles, cambios,
          tiempo_inicio, tiempo_fin, duracion_segundos, direccion_ip, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    usuario_id,
                    documento_id,
                    caso_id,
                    accion,
                    detalles,
                    cambios,
                    tiempo_inicio,
                    tiempo_fin,
                    duracion_segundos,
                    direccion_ip,
                    user_agent
                ]
            );

            return result.id;
        } catch (error) {
            console.error('Error registrando log:', error);
            throw error;
        }
    }

    // Iniciar sesión de trabajo
    static async startWorkSession(usuario_id, documento_id, ipAddress, userAgent) {
        try {
            const logId = await this.record({
                usuario_id,
                documento_id,
                accion: 'abrir',
                tiempo_inicio: new Date().toISOString(),
                direccion_ip: ipAddress,
                user_agent: userAgent
            });

            return logId;
        } catch (error) {
            throw error;
        }
    }

    // Finalizar sesión de trabajo
    static async endWorkSession(logId, cambios = null) {
        const db = getDatabase();

        try {
            // Obtener tiempo inicio
            const log = await db.get(
                'SELECT tiempo_inicio FROM logs_actividad WHERE id = ?',
                [logId]
            );

            if (!log) {
                throw new Error('Sesión de trabajo no encontrada');
            }

            const tiempo_inicio = new Date(log.tiempo_inicio);
            const tiempo_fin = new Date();
            const duracion_segundos = Math.floor((tiempo_fin - tiempo_inicio) / 1000);

            await db.run(
                `UPDATE logs_actividad 
         SET tiempo_fin = ?, duracion_segundos = ?, cambios = ?, accion = 'editar'
         WHERE id = ?`,
                [tiempo_fin.toISOString(), duracion_segundos, cambios || null, logId]
            );

            return duracion_segundos;
        } catch (error) {
            throw error;
        }
    }

    // Obtener logs por usuario
    static async getByUser(userId, limit = 50, offset = 0) {
        const db = getDatabase();

        try {
            const logs = await db.all(
                `SELECT l.*, d.nombre_original as documento_nombre,
                c.numero_caso, c.titulo as caso_titulo
         FROM logs_actividad l
         LEFT JOIN documentos d ON l.documento_id = d.id
         LEFT JOIN casos c ON l.caso_id = c.id
         WHERE l.usuario_id = ?
         ORDER BY l.fecha_registro DESC
         LIMIT ? OFFSET ?`,
                [userId, limit, offset]
            );

            const total = await db.get(
                'SELECT COUNT(*) as count FROM logs_actividad WHERE usuario_id = ?',
                [userId]
            );

            return {
                logs,
                total: total.count,
                limit,
                offset
            };
        } catch (error) {
            throw error;
        }
    }

    // Obtener logs por documento
    static async getByDocument(documentId, limit = 50, offset = 0) {
        const db = getDatabase();

        try {
            const logs = await db.all(
                `SELECT l.*, u.nombre, u.apellido, u.email
         FROM logs_actividad l
         JOIN usuarios u ON l.usuario_id = u.id
         WHERE l.documento_id = ?
         ORDER BY l.fecha_registro DESC
         LIMIT ? OFFSET ?`,
                [documentId, limit, offset]
            );

            const total = await db.get(
                'SELECT COUNT(*) as count FROM logs_actividad WHERE documento_id = ?',
                [documentId]
            );

            return {
                logs,
                total: total.count,
                limit,
                offset
            };
        } catch (error) {
            throw error;
        }
    }

    // Obtener estadísticas de trabajo
    static async getWorkStatistics(userId, startDate, endDate) {
        const db = getDatabase();

        try {
            const stats = await db.get(
                `SELECT 
          COUNT(*) as total_sesiones,
          SUM(duracion_segundos) as total_segundos,
          AVG(duracion_segundos) as promedio_segundos,
          COUNT(DISTINCT documento_id) as documentos_trabajados
         FROM logs_actividad 
         WHERE usuario_id = ? 
           AND accion = 'editar'
           AND fecha_registro >= ? 
           AND fecha_registro <= ?`,
                [userId, startDate, endDate]
            );

            // Documentos más trabajados
            const topDocuments = await db.all(
                `SELECT d.nombre_original, l.documento_id,
                SUM(l.duracion_segundos) as tiempo_total,
                COUNT(*) as sesiones
         FROM logs_actividad l
         JOIN documentos d ON l.documento_id = d.id
         WHERE l.usuario_id = ? 
           AND l.accion = 'editar'
           AND l.fecha_registro >= ? 
           AND l.fecha_registro <= ?
         GROUP BY l.documento_id
         ORDER BY tiempo_total DESC
         LIMIT 10`,
                [userId, startDate, endDate]
            );

            return {
                ...stats,
                topDocuments
            };
        } catch (error) {
            throw error;
        }
    }

    // Obtener actividad reciente del sistema
    static async getRecentActivity(limit = 100) {
        const db = getDatabase();

        try {
            const activities = await db.all(
                `SELECT l.*, 
                u.nombre, u.apellido, u.email,
                d.nombre_original as documento_nombre,
                c.numero_caso, c.titulo as caso_titulo
         FROM logs_actividad l
         LEFT JOIN usuarios u ON l.usuario_id = u.id
         LEFT JOIN documentos d ON l.documento_id = d.id
         LEFT JOIN casos c ON l.caso_id = c.id
         ORDER BY l.fecha_registro DESC
         LIMIT ?`,
                [limit]
            );

            return activities;
        } catch (error) {
            throw error;
        }
    }

    // Limpiar logs antiguos
    static async cleanupOldLogs(daysToKeep = 365) {
        const db = getDatabase();

        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            const result = await db.run(
                'DELETE FROM logs_actividad WHERE fecha_registro < ?',
                [cutoffDate.toISOString()]
            );

            return result.changes;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Log;
