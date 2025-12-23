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
        // Tabla Extendida: Usuarios (Con roles empresariales)
        `CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo_usuario VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            
            -- Datos Personales
            nombre VARCHAR(100) NOT NULL,
            apellido_paterno VARCHAR(100) NOT NULL,
            apellido_materno VARCHAR(100),
            telefono VARCHAR(20),
            puesto VARCHAR(100),
            departamento VARCHAR(100),
            
            -- Roles y Permisos
            rol_principal VARCHAR(30) CHECK(
                rol_principal IN ('superadmin', 'admin', 'abogado', 'asistente', 
                                 'contador', 'gerente', 'analista', 'consultor')
            ),
            permisos TEXT, -- JSON
            especialidades TEXT, -- JSON Array
            
            -- Campos del Sistema Legal
            numero_cedula VARCHAR(50),
            estado_cedula VARCHAR(20),
            
            -- Campos del Sistema Empresarial
            tarifa_horaria DECIMAL(10,2) DEFAULT 0.00,
            costo_hora DECIMAL(10,2) DEFAULT 0.00,
            unidad_negocio_asignada INTEGER,
            
            -- Estado
            activo BOOLEAN DEFAULT 1,
            fecha_ingreso DATE,
            fecha_baja DATE,
            
            -- Seguridad
            ultimo_acceso DATETIME,
            intentos_login INTEGER DEFAULT 0,
            bloqueado_hasta DATETIME,
            
            -- Metadata
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion DATETIME,
            metadata TEXT,
            
            FOREIGN KEY (unidad_negocio_asignada) REFERENCES unidades_casos(id) ON DELETE SET NULL
        )`,

        // Tabla de Empresas (Fusión de Clientes - Arquitectura Fusionada)
        `CREATE TABLE IF NOT EXISTS empresas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo_empresa VARCHAR(50) UNIQUE NOT NULL,
            nombre_legal VARCHAR(200) NOT NULL,
            nombre_comercial VARCHAR(200),
            tipo_empresa VARCHAR(20) CHECK(
                tipo_empresa IN ('cliente', 'proveedor', 'contratante', 'adversario', 'tercero')
            ),
            rfc VARCHAR(20),
            regimen_fiscal VARCHAR(50),
            direccion_fiscal TEXT,
            telefono_principal VARCHAR(20),
            email_contacto VARCHAR(100),
            contacto_legal VARCHAR(150),
            telefono_legal VARCHAR(20),
            email_legal VARCHAR(100),
            representante_legal VARCHAR(150),
            sector_industrial VARCHAR(100),
            tamaño_empresa VARCHAR(20) CHECK(
                tamaño_empresa IN ('micro', 'pequeña', 'mediana', 'grande')
            ),
            clasificacion_riesgo VARCHAR(20) CHECK(
                clasificacion_riesgo IN ('bajo', 'medio', 'alto', 'critico')
            ),
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion DATETIME,
            activo BOOLEAN DEFAULT 1,
            notas TEXT,
            metadata TEXT
        )`,

        // Tabla Híbrida: Unidades de Caso (Fusión de unidades_negocio + casos)
        `CREATE TABLE IF NOT EXISTS unidades_casos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo_unidad VARCHAR(50) UNIQUE NOT NULL,
            empresa_id INTEGER NOT NULL,
            tipo_unidad VARCHAR(20) CHECK(
                tipo_unidad IN ('caso_legal', 'proyecto', 'departamento', 'contrato', 'litigio')
            ),
            nombre VARCHAR(200) NOT NULL,
            descripcion TEXT,
            estado VARCHAR(30) CHECK(
                estado IN ('activo', 'pendiente', 'en_proceso', 'cerrado', 'archivado', 'suspendido')
            ),
            prioridad VARCHAR(20) CHECK(
                prioridad IN ('baja', 'media', 'alta', 'urgente', 'critica')
            ),
            
            -- Campos Legales
            numero_expediente VARCHAR(100),
            juzgado VARCHAR(150),
            materia_legal VARCHAR(100),
            etapa_procesal VARCHAR(50),
            fecha_inicio DATE,
            fecha_vencimiento DATE,
            fecha_cierre DATE,
            resultado_final VARCHAR(100),
            
            -- Campos Financieros
            presupuesto_asignado DECIMAL(15,2) DEFAULT 0.00,
            presupuesto_gastado DECIMAL(15,2) DEFAULT 0.00,
            presupuesto_pendiente DECIMAL(15,2) DEFAULT 0.00,
            tasa_horaria DECIMAL(10,2) DEFAULT 0.00,
            honorarios_estimados DECIMAL(15,2) DEFAULT 0.00,
            honorarios_facturados DECIMAL(15,2) DEFAULT 0.00,
            honorarios_pendientes DECIMAL(15,2) DEFAULT 0.00,
            
            -- Campos Operativos
            responsable_id INTEGER,
            equipo_ids TEXT, -- JSON Array
            porcentaje_completado INTEGER DEFAULT 0,
            
            -- Metadata
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion DATETIME,
            creado_por INTEGER,
            metadata TEXT, -- JSON
            
            -- Claves Foráneas
            FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
            FOREIGN KEY (responsable_id) REFERENCES usuarios(id) ON DELETE SET NULL,
            FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL
        )`,

        // Tabla Extendida: Documentos (Con costos asociados y enlace a unidad_caso)
        `CREATE TABLE IF NOT EXISTS documentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unidad_caso_id INTEGER NOT NULL,
            codigo_documento VARCHAR(50) UNIQUE NOT NULL,
            nombre_original VARCHAR(255) NOT NULL,
            nombre_archivo VARCHAR(255) NOT NULL,
            descripcion TEXT,
            
            -- Campos del Sistema Legal
            tipo_documento VARCHAR(50) CHECK(
                tipo_documento IN ('contrato', 'demanda', 'fianza', 'reporte', 'correspondencia', 
                                  'evidencia', 'sentencia', 'acuerdo', 'poder', 'escritura')
            ),
            confidencialidad INTEGER CHECK(confidencialidad BETWEEN 1 AND 5),
            version_actual INTEGER DEFAULT 1,
            hash_archivo VARCHAR(64),
            ruta_fisica VARCHAR(500),
            
            -- Campos del Sistema Empresarial
            horas_trabajo DECIMAL(5,2) DEFAULT 0.00,
            costo_estimado DECIMAL(10,2) DEFAULT 0.00,
            costo_real DECIMAL(10,2) DEFAULT 0.00,
            facturable BOOLEAN DEFAULT 1,
            estado_facturacion VARCHAR(20) CHECK(
                estado_facturacion IN ('no_facturado', 'pendiente', 'facturado', 'pagado')
            ),
            
            -- Metadata
            extension VARCHAR(10),
            tamaño_bytes INTEGER,
            usuario_subio INTEGER,
            fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_modificacion DATETIME,
            fecha_vencimiento DATE,
            
            -- Claves Foráneas
            FOREIGN KEY (unidad_caso_id) REFERENCES unidades_casos(id) ON DELETE CASCADE,
            FOREIGN KEY (usuario_subio) REFERENCES usuarios(id) ON DELETE SET NULL
        )`,

        // Tabla Unificada: Transacciones Financieras
        `CREATE TABLE IF NOT EXISTS transacciones_financieras (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unidad_caso_id INTEGER NOT NULL,
            codigo_transaccion VARCHAR(50) UNIQUE NOT NULL,
            tipo_transaccion VARCHAR(30) CHECK(
                tipo_transaccion IN ('ingreso', 'gasto', 'honorario', 'reembolso', 
                                    'adelanto', 'multa', 'indemnizacion', 'otros')
            ),
            categoria VARCHAR(50),
            descripcion TEXT NOT NULL,
            
            -- Campos Financieros
            monto DECIMAL(15,2) NOT NULL,
            moneda VARCHAR(3) DEFAULT 'MXN',
            tasa_cambio DECIMAL(10,4) DEFAULT 1.0000,
            monto_base DECIMAL(15,2),
            
            -- Relaciones
            documento_id INTEGER,
            proveedor_id INTEGER,
            factura_id INTEGER,
            
            -- Estado
            estado VARCHAR(20) CHECK(
                estado IN ('pendiente', 'confirmado', 'cancelado', 'rechazado')
            ),
            metodo_pago VARCHAR(30),
            cuenta_bancaria VARCHAR(50),
            
            -- Fechas
            fecha_transaccion DATE NOT NULL,
            fecha_vencimiento DATE,
            fecha_pago DATE,
            
            -- Metadata
            creado_por INTEGER,
            aprobado_por INTEGER,
            notas TEXT,
            metadata TEXT,
            
            -- Claves Foráneas
            FOREIGN KEY (unidad_caso_id) REFERENCES unidades_casos(id) ON DELETE CASCADE,
            FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE SET NULL,
            FOREIGN KEY (proveedor_id) REFERENCES empresas(id) ON DELETE SET NULL,
            FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
            FOREIGN KEY (aprobado_por) REFERENCES usuarios(id) ON DELETE SET NULL
        )`,

        // Tabla: Tareas y Actividades (Seguimiento de trabajo)
        `CREATE TABLE IF NOT EXISTS tareas_actividades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            unidad_caso_id INTEGER NOT NULL,
            codigo_tarea VARCHAR(50) UNIQUE NOT NULL,
            titulo VARCHAR(200) NOT NULL,
            descripcion TEXT,
            
            -- Tipos de Tareas
            tipo_tarea VARCHAR(30) CHECK(
                tipo_tarea IN ('documento', 'revision', 'audiencia', 'investigacion', 
                              'reunion', 'llamada', 'correspondencia', 'analisis')
            ),
            
            -- Asignación
            asignado_a INTEGER,
            creado_por INTEGER,
            
            -- Estado y Prioridad
            estado VARCHAR(20) CHECK(
                estado IN ('pendiente', 'en_progreso', 'completada', 'cancelada', 'en_revision')
            ),
            prioridad VARCHAR(20) CHECK(
                prioridad IN ('baja', 'media', 'alta', 'urgente')
            ),
            
            -- Fechas
            fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
            fecha_inicio DATE,
            fecha_vencimiento DATE,
            fecha_completado DATETIME,
            
            -- Tiempos
            horas_estimadas DECIMAL(5,2) DEFAULT 0.00,
            horas_reales DECIMAL(5,2) DEFAULT 0.00,
            
            -- Relaciones
            documento_id INTEGER,
            
            -- Seguimiento
            porcentaje_completado INTEGER DEFAULT 0,
            notas TEXT,
            checklist TEXT,
            
            -- Claves Foráneas
            FOREIGN KEY (unidad_caso_id) REFERENCES unidades_casos(id) ON DELETE CASCADE,
            FOREIGN KEY (asignado_a) REFERENCES usuarios(id) ON DELETE SET NULL,
            FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
            FOREIGN KEY (documento_id) REFERENCES documentos(id) ON DELETE SET NULL
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
        `CREATE TABLE IF NOT EXISTS documentos_legacy (
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
        'CREATE INDEX IF NOT EXISTS idx_empresas_codigo ON empresas(codigo_empresa)',
        'CREATE INDEX IF NOT EXISTS idx_empresas_nombre ON empresas(nombre_legal)',
        'CREATE INDEX IF NOT EXISTS idx_unidades_empresa ON unidades_casos(empresa_id)',
        'CREATE INDEX IF NOT EXISTS idx_unidades_responsable ON unidades_casos(responsable_id)',
        'CREATE INDEX IF NOT EXISTS idx_unidades_estado ON unidades_casos(estado)',
        'CREATE INDEX IF NOT EXISTS idx_unidades_tipo ON unidades_casos(tipo_unidad)',
        'CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)',
        'CREATE INDEX IF NOT EXISTS idx_documentos_legacy_caso_id ON documentos_legacy(caso_id)',
        'CREATE INDEX IF NOT EXISTS idx_documentos_legacy_usuario_propietario ON documentos_legacy(usuario_propietario)',
        'CREATE INDEX IF NOT EXISTS idx_documentos_unidad ON documentos(unidad_caso_id)',
        'CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON documentos(tipo_documento)',
        'CREATE INDEX IF NOT EXISTS idx_documentos_facturacion ON documentos(estado_facturacion)',
        'CREATE INDEX IF NOT EXISTS idx_transacciones_unidad ON transacciones_financieras(unidad_caso_id)',
        'CREATE INDEX IF NOT EXISTS idx_transacciones_tipo ON transacciones_financieras(tipo_transaccion)',
        'CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON transacciones_financieras(fecha_transaccion)',
        'CREATE INDEX IF NOT EXISTS idx_tareas_unidad ON tareas_actividades(unidad_caso_id)',
        'CREATE INDEX IF NOT EXISTS idx_tareas_asignado ON tareas_actividades(asignado_a)',
        'CREATE INDEX IF NOT EXISTS idx_tareas_estado ON tareas_actividades(estado)',
        'CREATE INDEX IF NOT EXISTS idx_tareas_vencimiento ON tareas_actividades(fecha_vencimiento)',
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
        codigo_usuario: 'ADM-001',
        email: 'admin@legal.com',
        password: 'Admin123!',
        nombre: 'Administrador',
        apellido_paterno: 'Sistema',
        rol_principal: 'admin',
        permisos: JSON.stringify({ admin: true }, null, 2),
        activo: 1
    };

    try {
        // Verificar si ya existe el admin
        const existingAdmin = await db.get('SELECT id FROM usuarios WHERE email = ?', [defaultAdmin.email]);

        if (!existingAdmin) {
            const passwordHash = await bcrypt.hash(defaultAdmin.password, 12);

            await db.run(
                `INSERT INTO usuarios (codigo_usuario, email, password_hash, nombre, apellido_paterno, rol_principal, permisos, activo) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    defaultAdmin.codigo_usuario,
                    defaultAdmin.email,
                    passwordHash,
                    defaultAdmin.nombre,
                    defaultAdmin.apellido_paterno,
                    defaultAdmin.rol_principal,
                    defaultAdmin.permisos,
                    defaultAdmin.activo
                ]
            );

            console.log('Usuario administrador creado (Esquema Extendido):');
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
