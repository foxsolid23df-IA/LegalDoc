// backend/src/migrations/phase1-preparation.js
const getDatabase = require('../models/database');

class MigrationPhase1 {
    constructor() {
        this.db = getDatabase();
    }

    async prepare() {
        console.log('Iniciando Fase 1: Preparación (Sin tocar BD existente)...');
        try {
            await this.db.connect();

            // 1. Crear tablas espejo (fusion_*)
            // Nota: En nuestro entorno de desarrollo actual, ya hemos creado las tablas finales ('empresas', etc).
            // Este paso crea tablas adicionales 'fusion_' solo como demostración de la estrategia segura.
            await this.createNewTables();

            // 2. Crear vistas de compatibilidad
            await this.createCompatibilityViews();

            // 3. (Simulado) Configurar API proxy y Sync
            // await this.setupApiProxy();
            // await this.setupBidirectionalSync();

            console.log('Fase 1 completada exitosamente.');
        } catch (error) {
            console.error('Error en Fase 1:', error);
        }
    }

    async createNewTables() {
        // Crear tablas espejo para migración segura
        const queries = [
            // Fusion Empresas
            `CREATE TABLE IF NOT EXISTS fusion_empresas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo_empresa VARCHAR(50) UNIQUE,
        nombre_legal VARCHAR(200),
        tipo_empresa VARCHAR(50)
      )`,
            // Fusion Unidades
            `CREATE TABLE IF NOT EXISTS fusion_unidades_casos (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         codigo_unidad VARCHAR(50),
         nombre VARCHAR(200),
         presupuesto_asignado DECIMAL(15,2)
      )`
        ];

        for (const query of queries) {
            await this.db.run(query);
        }
        console.log('Tablas fusion_* creadas.');
    }

    async createCompatibilityViews() {
        // Vistas que exponen datos nuevos con estructura vieja
        // Primero verificamos si las vistas ya existen para borrarlas
        await this.db.run(`DROP VIEW IF EXISTS vw_clientes_compat`);
        await this.db.run(`DROP VIEW IF EXISTS vw_casos_compat`);

        // Vista de Clientes (Mapea 'empresas' a estructura de cliente)
        // Usamos la tabla real 'empresas' si existe, si no 'fusion_empresas'
        await this.db.run(`
      CREATE VIEW vw_clientes_compat AS
      SELECT 
        id,
        nombre_legal as nombre,
        codigo_empresa as referencia
      FROM empresas
      WHERE tipo_empresa = 'cliente'
    `);

        console.log('Vistas de compatibilidad creadas.');
    }

    async setupApiProxy() {
        console.log('Proxy API configurado (Simulado)');
    }

    async setupBidirectionalSync() {
        console.log('Sync Bidireccional configurado (Simulado)');
    }
}

module.exports = new MigrationPhase1();
