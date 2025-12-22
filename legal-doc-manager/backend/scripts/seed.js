const getDatabase = require('../src/models/database');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

async function seedDatabase() {
    const db = getDatabase();

    try {
        console.log('🌱 Iniciando carga de datos ficticios (Semilla)...');
        await db.connect();

        // 1. Usuarios
        console.log('Creando usuarios...');
        const users = [
            { email: 'abogado@legal.com', password: 'User123!', nombre: 'Roberto', apellido: 'García', rol: 'abogado', permisos: 'editor' },
            { email: 'asistente@legal.com', password: 'User123!', nombre: 'Ana', apellido: 'Martínez', rol: 'asistente', permisos: 'lectura' }
        ];

        for (const user of users) {
            const hash = await bcrypt.hash(user.password, 10);
            await db.run(
                `INSERT OR IGNORE INTO usuarios (email, password_hash, nombre, apellido, rol, permisos) VALUES (?, ?, ?, ?, ?, ?)`,
                [user.email, hash, user.nombre, user.apellido, user.rol, user.permisos]
            );
        }

        // 2. Clientes
        console.log('Creando clientes...');
        const clientes = [
            { nombre: 'Corporación Inmobiliaria S.A.', tipo_documento: 'RFC', numero_documento: 'CIS980202H45', direccion: 'Av. Reforma 222, CDMX', email: 'contacto@cis.com' },
            { nombre: 'Juan Pérez López', tipo_documento: 'INE', numero_documento: '1234567890123', direccion: 'Calle Pino 45, Guadalajara', email: 'juan.perez@gmail.com' },
            { nombre: 'Tecnología Global Ltd', tipo_documento: 'RFC', numero_documento: 'TGL100101T78', direccion: 'Parque Industrial, Monterrey', email: 'admin@tecnoglobal.com' }
        ];

        for (const cliente of clientes) {
            await db.run(
                `INSERT OR IGNORE INTO clientes (nombre, tipo_documento, numero_documento, direccion, contacto_email) VALUES (?, ?, ?, ?, ?)`,
                [cliente.nombre, cliente.tipo_documento, cliente.numero_documento, cliente.direccion, cliente.email]
            );
        }

        // 3. Casos
        console.log('Creando casos...');
        // Obtener IDs
        const cliente1 = await db.get("SELECT id FROM clientes WHERE nombre LIKE 'Corp%'");
        const cliente2 = await db.get("SELECT id FROM clientes WHERE nombre LIKE 'Juan%'");
        const admin = await db.get("SELECT id FROM usuarios WHERE email = 'admin@legal.com'");

        if (cliente1 && admin) {
            const casos = [
                { numero: 'CAS-2024-001', titulo: 'Demanda Laboral vs CIS', descripcion: 'Demanda por despido injustificado', cliente_id: cliente1.id, estado: 'activo', prioridad: 'alta' },
                { numero: 'CAS-2024-002', titulo: 'Contrato Arrendamiento Oficina', descripcion: 'Revisión de contrato de oficinas centrales', cliente_id: cliente1.id, estado: 'pendiente', prioridad: 'media' },
                { numero: 'CAS-2024-003', titulo: 'Divorcio Voluntario', descripcion: 'Trámite de divorcio mutuo acuerdo', cliente_id: cliente2.id, estado: 'activo', prioridad: 'baja' }
            ];

            for (const caso of casos) {
                await db.run(
                    `INSERT OR IGNORE INTO casos (numero_caso, titulo, descripcion, cliente_id, abogado_responsable, estado, prioridad) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [caso.numero, caso.titulo, caso.descripcion, caso.cliente_id, admin.id, caso.estado, caso.prioridad]
                );
            }
        }

        // 4. Documentos Ficticios
        console.log('Generando registros de documentos...');
        const caso1 = await db.get("SELECT id FROM casos WHERE numero_caso = 'CAS-2024-001'");

        if (caso1 && admin) {
            const docs = [
                { nombre: 'Demanda_Inicial.pdf', tipo: 'demanda', size: 1024500, confidencialidad: 4 },
                { nombre: 'Contrato_V1.docx', tipo: 'contrato', size: 512000, confidencialidad: 3 },
                { nombre: 'Evidencia_Fotos.zip', tipo: 'evidencia', size: 2048000, confidencialidad: 5 },
                { nombre: 'Notificación_Juzgado.pdf', tipo: 'correspondencia', size: 128000, confidencialidad: 2 }
            ];

            for (const doc of docs) {
                // Insertar en DB aunque no exista archivo físico
                await db.run(
                    `INSERT INTO documentos (nombre_archivo, nombre_original, ruta_fisica, caso_id, tipo_documento, extension, tamaño_bytes, confidencialidad, usuario_propietario) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        `dummy_${Date.now()}_${doc.nombre}`,
                        doc.nombre,
                        path.join(__dirname, '../../uploads/dummy.pdf'),
                        caso1.id,
                        doc.tipo,
                        path.extname(doc.nombre).substring(1),
                        doc.size,
                        doc.confidencialidad,
                        admin.id
                    ]
                );
            }
        }

        // 5. Crear Logs
        console.log('Generando historial de actividad...');
        const actions = ['login', 'abrir', 'editar', 'subir', 'logout'];
        for (let i = 0; i < 15; i++) {
            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            const randomUser = Math.random() > 0.5 ? admin.id : (await db.get('SELECT id FROM usuarios WHERE email="abogado@legal.com"'))?.id || admin.id;

            await db.run(
                `INSERT INTO logs_actividad (usuario_id, accion, detalles, direccion_ip, fecha_registro) VALUES (?, ?, ?, ?, datetime('now', '-${Math.floor(Math.random() * 5)} days'))`,
                [randomUser, randomAction, `Acción simulada: ${randomAction}`, '192.168.1.1']
            );
        }

        console.log('✅ Base de datos poblada con éxito. ¡Listo para Demo!');

    } catch (error) {
        console.error('❌ Error llenando datos:', error);
    } finally {
        await db.close();
    }
}

seedDatabase();
