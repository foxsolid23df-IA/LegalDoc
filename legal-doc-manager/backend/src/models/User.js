const getDatabase = require('./database');
const bcrypt = require('bcryptjs');

class User {
    // Crear nuevo usuario
    static async create(userData) {
        const db = getDatabase();
        const {
            email,
            password,
            nombre,
            apellido,
            rol = 'abogado',
            permisos = 'lectura'
        } = userData;

        try {
            // Verificar si el usuario ya existe
            const existingUser = await db.get('SELECT id FROM usuarios WHERE email = ?', [email]);
            if (existingUser) {
                throw new Error('El email ya está registrado');
            }

            // Hash de la contraseña
            const passwordHash = await bcrypt.hash(password, 12);

            // Insertar usuario
            const result = await db.run(
                `INSERT INTO usuarios (email, password_hash, nombre, apellido, rol, permisos)
         VALUES (?, ?, ?, ?, ?, ?)`,
                [email, passwordHash, nombre, apellido, rol, permisos]
            );

            return {
                id: result.id,
                email,
                nombre,
                apellido,
                rol,
                permisos,
                activo: true
            };
        } catch (error) {
            throw error;
        }
    }

    // Buscar usuario por email
    static async findByEmail(email) {
        const db = getDatabase();
        try {
            const user = await db.get(
                `SELECT id, email, password_hash, nombre, apellido, rol, permisos, activo,
                fecha_creacion, ultimo_acceso, intentos_login, bloqueado_hasta
         FROM usuarios WHERE email = ?`,
                [email]
            );
            return user;
        } catch (error) {
            throw error;
        }
    }

    // Buscar usuario por ID
    static async findById(id) {
        const db = getDatabase();
        try {
            const user = await db.get(
                `SELECT id, email, nombre, apellido, rol, permisos, activo,
                fecha_creacion, ultimo_acceso
         FROM usuarios WHERE id = ?`,
                [id]
            );
            return user;
        } catch (error) {
            throw error;
        }
    }

    // Verificar contraseña
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // Actualizar último acceso
    static async updateLastAccess(userId, ipAddress) {
        const db = getDatabase();
        try {
            await db.run(
                'UPDATE usuarios SET ultimo_acceso = CURRENT_TIMESTAMP WHERE id = ?',
                [userId]
            );

            // Registrar login exitoso
            await this.recordLoginAttempt(userId, true, ipAddress);
        } catch (error) {
            throw error;
        }
    }

    // Registrar intento de login
    static async recordLoginAttempt(userId, success, ipAddress) {
        const db = getDatabase();
        try {
            if (success) {
                await db.run(
                    'UPDATE usuarios SET intentos_login = 0, bloqueado_hasta = NULL WHERE id = ?',
                    [userId]
                );
            } else {
                await db.run(
                    'UPDATE usuarios SET intentos_login = intentos_login + 1 WHERE id = ?',
                    [userId]
                );

                // Bloquear usuario después de 5 intentos fallidos
                const user = await db.get(
                    'SELECT intentos_login FROM usuarios WHERE id = ?',
                    [userId]
                );

                if (user.intentos_login >= 5) {
                    const bloqueadoHasta = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
                    await db.run(
                        'UPDATE usuarios SET bloqueado_hasta = ? WHERE id = ?',
                        [bloqueadoHasta.toISOString(), userId]
                    );
                }
            }
        } catch (error) {
            throw error;
        }
    }

    // Verificar si usuario está bloqueado
    static async isUserBlocked(userId) {
        const db = getDatabase();
        try {
            const user = await db.get(
                'SELECT bloqueado_hasta FROM usuarios WHERE id = ?',
                [userId]
            );

            if (user && user.bloqueado_hasta) {
                const bloqueadoHasta = new Date(user.bloqueado_hasta);
                if (bloqueadoHasta > new Date()) {
                    return bloqueadoHasta;
                }
            }
            return null;
        } catch (error) {
            throw error;
        }
    }

    // Obtener todos los usuarios (para admin)
    static async getAll(limit = 100, offset = 0) {
        const db = getDatabase();
        try {
            const users = await db.all(
                `SELECT id, email, nombre, apellido, rol, permisos, activo,
                fecha_creacion, ultimo_acceso
         FROM usuarios 
         ORDER BY fecha_creacion DESC
         LIMIT ? OFFSET ?`,
                [limit, offset]
            );

            const total = await db.get('SELECT COUNT(*) as count FROM usuarios');

            return {
                users,
                total: total.count,
                limit,
                offset
            };
        } catch (error) {
            throw error;
        }
    }

    // Actualizar usuario
    static async update(userId, updateData) {
        const db = getDatabase();
        const allowedFields = ['nombre', 'apellido', 'rol', 'permisos', 'activo'];

        try {
            const updateFields = [];
            const values = [];

            // Construir consulta dinámica
            for (const [field, value] of Object.entries(updateData)) {
                if (allowedFields.includes(field)) {
                    updateFields.push(`${field} = ?`);
                    values.push(value);
                }
            }

            if (updateFields.length === 0) {
                throw new Error('No hay campos válidos para actualizar');
            }

            values.push(userId);

            const sql = `UPDATE usuarios SET ${updateFields.join(', ')} WHERE id = ?`;
            await db.run(sql, values);

            return await this.findById(userId);
        } catch (error) {
            throw error;
        }
    }

    // Cambiar contraseña
    static async changePassword(userId, currentPassword, newPassword) {
        const db = getDatabase();

        try {
            // Obtener usuario y hash actual
            const user = await db.get(
                'SELECT password_hash FROM usuarios WHERE id = ?',
                [userId]
            );

            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // Verificar contraseña actual
            const isValid = await bcrypt.compare(currentPassword, user.password_hash);
            if (!isValid) {
                throw new Error('Contraseña actual incorrecta');
            }

            // Hash nueva contraseña
            const newPasswordHash = await bcrypt.hash(newPassword, 12);

            // Actualizar
            await db.run(
                'UPDATE usuarios SET password_hash = ? WHERE id = ?',
                [newPasswordHash, userId]
            );

            return true;
        } catch (error) {
            throw error;
        }
    }

    // Resetear contraseña (solo admin)
    static async resetPassword(userId, newPassword) {
        const db = getDatabase();

        try {
            const newPasswordHash = await bcrypt.hash(newPassword, 12);

            await db.run(
                'UPDATE usuarios SET password_hash = ?, intentos_login = 0, bloqueado_hasta = NULL WHERE id = ?',
                [newPasswordHash, userId]
            );

            return true;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User;
