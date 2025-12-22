const getDatabase = require('./database');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

async function initializeDatabase() {
    const db = getDatabase();

    try {
        await db.connect();

        console.log('Inicializando base de datos...');

        // Crear tablas
        await createTables(db);

        // Crear usuario administrador por defecto
        await createDefaultAdmin(db);

        console.log('Base de datos inicializada exitosamente');

    } catch (error) {
        console.error('Error inicializando base de datos:', error);
        process.exit(1);
    } finally {
        await db.close();
    }
}

async function createTables(db) {
    const tables = [
        // Tabla de Usuarios
        `CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      nombre VARCHAR(100) NOT NULL,
      apellido VARCHAR(100) NOT NULL,
      rol VARCHAR(20) CHECK(rol IN ('admin', 'abogado', 'asistente')) DEFAULT 'abogado',
      permisos VARCHAR(20) CHECK(permisos IN ('lectura', 'editor', 'full')) DEFAULT 'lectura',
      activo BOOLEAN DEFAULT 1,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      ultimo_acceso DATETIME,
      intentos_login INTEGER DEFAULT 0,
      bloqueado_hasta DATETIME
    )`,

        // Tabla de Clientes
        `CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre VARCHAR(150) NOT NULL,
      tipo_documento VARCHAR(20),
      numero_documento VARCHAR(50) UNIQUE,
      direccion TEXT,
      contacto_email VARCHAR(100),
      contacto_telefono VARCHAR(20),
      fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
      notas TEXT
    )`,

        // Tabla de Casos
        `CREATE TABLE IF NOT EXISTS casos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero_caso VARCHAR(50) UNIQUE NOT NULL,
      titulo VARCHAR(200) NOT NULL,
      descripcion TEXT,
      cliente_id INTEGER,
      abogado_responsable INTEGER,
      estado VARCHAR(30) DEFAULT 'activo',
      fecha_apertura DATETIME DEFAULT CURRENT_TIMESTAMP,
      fecha_cierre DATETIME,
      prioridad VARCHAR(20) CHECK(prioridad IN ('baja', 'media', 'alta', 'urgente')) DEFAULT 'media',
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
      FOREIGN KEY (abogado_responsable) REFERENCES usuarios(id) ON DELETE SET NULL
    )`,

        // Tabla de Documentos
        `CREATE TABLE IF NOT EXISTS documentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre_archivo VARCHAR(255) NOT NULL,
      nombre_original VARCHAR(255) NOT NULL,
      ruta_fisica VARCHAR(500) NOT NULL,
      hash_archivo VARCHAR(64),
      caso_id INTEGER,
      tipo_documento VARCHAR(50) CHECK(tipo_documento IN ('contrato', 'demanda', 'fianza', 'reporte', 'correspondencia', 'evidencia', 'otro')),
      extension VARCHAR(10),
      tamaño_bytes INTEGER,
      confidencialidad INTEGER CHECK(confidencialidad BETWEEN 1 AND 5) DEFAULT 3,
      usuario_propietario INTEGER,
      version_actual INTEGER DEFAULT 1,
      fecha_upload DATETIME DEFAULT CURRENT_TIMESTAMP,
      fecha_modificacion DATETIME,
      FOREIGN KEY (caso_id) REFERENCES casos(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_propietario) REFERENCES usuarios(id) ON DELETE SET NULL
    )`,

        // Tabla de Bloqueos de Documentos
        `CREATE TABLE IF NOT EXISTS bloqueos_documentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      documento_id INTEGER NOT NULL,
      usuario_id INTEGER NOT NULL,
      fecha_bloqueo DATETIME DEFAULT CURRENT_TIMESTAMP,
      direccion_ip VARCHAR(45),
      sesion_id VARCHAR(100),
      FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      UNIQUE(documento_id)
    )`,

        // Tabla de Logs de Actividad
        `CREATE TABLE IF NOT EXISTS logs_actividad (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      documento_id INTEGER,
      caso_id INTEGER,
      accion VARCHAR(50) CHECK(accion IN ('login', 'logout', 'abrir', 'editar', 'guardar', 'descargar', 'eliminar', 'compartir', 'subir', 'crear', 'actualizar')),
      detalles TEXT,
      cambios TEXT,
      tiempo_inicio DATETIME,
      tiempo_fin DATETIME,
      duracion_segundos INTEGER,
      direccion_ip VARCHAR(45),
      user_agent TEXT,
      fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
      FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE SET NULL,
      FOREIGN KEY (caso_id) REFERENCES casos(id) ON DELETE SET NULL
    )`,

        // Tabla de Versiones de Documentos
        `CREATE TABLE IF NOT EXISTS versiones_documentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      documento_id INTEGER NOT NULL,
      version INTEGER NOT NULL,
      usuario_id INTEGER,
      ruta_fisica VARCHAR(500),
      hash_version VARCHAR(64),
      comentario TEXT,
      cambios TEXT,
      fecha_version DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
      UNIQUE(documento_id, version)
    )`,

        // Tabla de Compartir Documentos
        `CREATE TABLE IF NOT EXISTS compartir_documentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      documento_id INTEGER NOT NULL,
      usuario_id INTEGER NOT NULL,
      permisos VARCHAR(20) CHECK(permisos IN ('lectura', 'editor')) DEFAULT 'lectura',
      compartido_por INTEGER,
      fecha_compartir DATETIME DEFAULT CURRENT_TIMESTAMP,
      fecha_expiracion DATETIME,
      activo BOOLEAN DEFAULT 1,
      FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      FOREIGN KEY (compartido_por) REFERENCES usuarios(id) ON DELETE SET NULL,
      UNIQUE(documento_id, usuario_id)
    )`,

        // Tabla de Plantillas de Documentos
        `CREATE TABLE IF NOT EXISTS plantillas_documentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre VARCHAR(150) NOT NULL,
      descripcion TEXT,
      contenido TEXT NOT NULL,
      tipo_documento VARCHAR(50),
      creado_por INTEGER,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion DATETIME,
      activo BOOLEAN DEFAULT 1,
      FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL
    )`
    ];

    for (const tableSql of tables) {
        try {
            await db.run(tableSql);
            console.log(`Tabla creada/verificada: ${tableSql.substring(0, 50)}...`);
        } catch (error) {
            console.error(`Error creando tabla:`, error.message);
        }
    }

    // Crear índices para mejorar el rendimiento
    const indices = [
        'CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)',
        'CREATE INDEX IF NOT EXISTS idx_documentos_caso_id ON documentos(caso_id)',
        'CREATE INDEX IF NOT EXISTS idx_documentos_usuario_propietario ON documentos(usuario_propietario)',
        'CREATE INDEX IF NOT EXISTS idx_logs_actividad_usuario_id ON logs_actividad(usuario_id)',
        'CREATE INDEX IF NOT EXISTS idx_logs_actividad_documento_id ON logs_actividad(documento_id)',
        'CREATE INDEX IF NOT EXISTS idx_logs_actividad_fecha ON logs_actividad(fecha_registro)',
        'CREATE INDEX IF NOT EXISTS idx_casos_cliente_id ON casos(cliente_id)',
        'CREATE INDEX IF NOT EXISTS idx_casos_estado ON casos(estado)',
        'CREATE INDEX IF NOT EXISTS idx_versiones_documento_id ON versiones_documentos(documento_id)',
        'CREATE INDEX IF NOT EXISTS idx_bloqueos_documento_id ON bloqueos_documentos(documento_id)',
        'CREATE INDEX IF NOT EXISTS idx_bloqueos_usuario_id ON bloqueos_documentos(usuario_id)'
    ];

    for (const indexSql of indices) {
        try {
            await db.run(indexSql);
        } catch (error) {
            console.error(`Error creando índice:`, error.message);
        }
    }
}

async function createDefaultAdmin(db) {
    const defaultAdmin = {
        email: 'admin@legal.com',
        password: 'Admin123!',
        nombre: 'Administrador',
        apellido: 'Sistema',
        rol: 'admin',
        permisos: 'full'
    };

    try {
        // Verificar si ya existe el admin
        const existingAdmin = await db.get('SELECT id FROM usuarios WHERE email = ?', [defaultAdmin.email]);

        if (!existingAdmin) {
            const passwordHash = await bcrypt.hash(defaultAdmin.password, 12);

            await db.run(
                `INSERT INTO usuarios (email, password_hash, nombre, apellido, rol, permisos) 
         VALUES (?, ?, ?, ?, ?, ?)`,
                [defaultAdmin.email, passwordHash, defaultAdmin.nombre, defaultAdmin.apellido, defaultAdmin.rol, defaultAdmin.permisos]
            );

            console.log('Usuario administrador creado:');
            console.log('Email:', defaultAdmin.email);
            console.log('Password:', defaultAdmin.password);
            console.log('IMPORTANTE: Cambiar esta contraseña inmediatamente después del primer login!');
        } else {
            console.log('Usuario administrador ya existe');
        }
    } catch (error) {
        console.error('Error creando usuario administrador:', error);
    }
}

// Ejecutar inicialización
if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase };
