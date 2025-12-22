const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

class Database {
    constructor() {
        this.dbPath = process.env.DB_PATH || path.join(__dirname, '../../legal.db');
        this.db = null;
    }

    // Conectar a la base de datos
    connect() {
        return new Promise((resolve, reject) => {
            // Verificar si el directorio existe
            const dir = path.dirname(this.dbPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error conectando a SQLite:', err.message);
                    reject(err);
                } else {
                    console.log('Conectado a la base de datos SQLite');
                    this.configureDatabase();
                    resolve(this.db);
                }
            });
        });
    }

    // Configurar parámetros de la base de datos
    configureDatabase() {
        const configs = [
            'PRAGMA journal_mode = WAL;',
            'PRAGMA foreign_keys = ON;',
            'PRAGMA busy_timeout = 5000;',
            'PRAGMA synchronous = NORMAL;',
            'PRAGMA cache_size = -2000;'
        ];

        configs.forEach(sql => {
            this.db.run(sql, (err) => {
                if (err) {
                    console.warn(`Error ejecutando ${sql}:`, err.message);
                }
            });
        });
    }

    // Ejecutar consulta
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    // Obtener un registro
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Obtener múltiples registros
    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Cerrar conexión
    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('Conexión a la base de datos cerrada');
                    resolve();
                }
            });
        });
    }

    // Iniciar transacción
    beginTransaction() {
        return this.run('BEGIN TRANSACTION');
    }

    // Commit transacción
    commit() {
        return this.run('COMMIT');
    }

    // Rollback transacción
    rollback() {
        return this.run('ROLLBACK');
    }
}

// Singleton para la instancia de base de datos
let instance = null;

function getDatabase() {
    if (!instance) {
        instance = new Database();
    }
    return instance;
}

module.exports = getDatabase;
