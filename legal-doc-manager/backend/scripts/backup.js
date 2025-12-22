#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const dotenv = require('dotenv');

dotenv.config();

const execPromise = util.promisify(exec);

async function createBackup() {
    console.log('🔄 Iniciando backup del sistema...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../backups', timestamp);

    try {
        // Crear directorio de backup
        await fs.mkdir(backupDir, { recursive: true });

        // 1. Backup de la base de datos
        console.log('📊 Realizando backup de la base de datos...');
        const dbPath = path.resolve(process.env.DB_PATH || './legal.db');
        const backupDbPath = path.join(backupDir, 'legal.db');

        try {
            await fs.copyFile(dbPath, backupDbPath);
            console.log('✓ Base de datos respaldada');
        } catch (err) {
            console.warn('⚠️  No se pudo respaldar la base de datos (puede que no exista):', err.message);
        }

        // 2. Backup de documentos (solo estructura, no contenido encriptado)
        console.log('📁 Realizando backup de metadatos de documentos...');
        try {
            // Ajuste de importación para CommonJS
            const getDatabase = require('../src/models/database');
            const db = getDatabase();
            await db.connect();

            // Exportar datos a SQL
            const tables = ['documentos', 'versiones_documentos', 'compartir_documentos'];
            let sqlExport = '';

            for (const table of tables) {
                try {
                    const rows = await db.all(`SELECT * FROM ${table}`);
                    if (rows.length > 0) {
                        sqlExport += `\n-- Data for table ${table}\n`;
                        // Nota: Esta es una implementación básica serialización JSON para backup
                        sqlExport += JSON.stringify(rows, null, 2);
                    }
                } catch (tableError) {
                    console.warn(`Aviso: Tabla ${table} no encontrada o vacía.`);
                }
            }

            await fs.writeFile(path.join(backupDir, 'metadata.json'), sqlExport);
            await db.close();
            console.log('✓ Metadatos de documentos respaldados');
        } catch (dbError) {
            console.warn('⚠️  Error respaldando metadatos:', dbError.message);
        }

        // 3. Backup de logs
        console.log('📝 Realizando backup de logs...');
        const logsDir = path.join(__dirname, '../logs');
        const backupLogsDir = path.join(backupDir, 'logs');

        try {
            await fs.mkdir(backupLogsDir, { recursive: true });
            if (require('fs').existsSync(logsDir)) {
                const logFiles = await fs.readdir(logsDir);

                for (const file of logFiles) {
                    if (file.endsWith('.log')) {
                        await fs.copyFile(
                            path.join(logsDir, file),
                            path.join(backupLogsDir, file)
                        );
                    }
                }
                console.log('✓ Logs respaldados');
            } else {
                console.log('ℹ️  Directorio de logs no existe, saltando.');
            }
        } catch (error) {
            console.warn('⚠️  No se pudieron respaldar los logs:', error.message);
        }

        // 4. Backup de configuración
        console.log('⚙️  Realizando backup de configuración...');
        const configFiles = ['.env', 'package.json'];

        for (const file of configFiles) {
            try {
                const srcPath = path.join(__dirname, '..', file);
                if (require('fs').existsSync(srcPath)) {
                    await fs.copyFile(
                        srcPath,
                        path.join(backupDir, file)
                    );
                }
            } catch (error) {
                console.warn(`⚠️  No se pudo respaldar ${file}:`, error.message);
            }
        }
        console.log('✓ Configuración respaldada');

        // 5. Comprimir backup
        console.log('🗜️  Comprimiendo backup...');
        const zipPath = `${backupDir}.zip`;

        // Usar zip si está disponible
        try {
            await execPromise(`zip -r "${zipPath}" "${backupDir}"`);
            // Eliminar directorio sin comprimir
            await fs.rm(backupDir, { recursive: true });
            console.log(`✓ Backup comprimido: ${zipPath}`);
        } catch (error) {
            console.warn('⚠️  No se pudo comprimir el backup (zip no disponible o error). Guardando como directorio.');
        }

        // 6. Limpiar backups antiguos
        console.log('🧹 Limpiando backups antiguos...');
        await cleanupOldBackups();

        console.log('\n✅ Backup completado exitosamente!');
        console.log(`📦 Ubicación: ${backupDir}${require('fs').existsSync(zipPath) ? '.zip' : ''}`);

    } catch (error) {
        console.error('❌ Error durante el backup:', error.message);
        process.exit(1);
    }
}

async function cleanupOldBackups() {
    const backupDir = path.join(__dirname, '../backups');
    if (!require('fs').existsSync(backupDir)) return;

    const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS) || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
        const items = await fs.readdir(backupDir);

        for (const item of items) {
            const itemPath = path.join(backupDir, item);
            const stats = await fs.stat(itemPath);

            if (stats.mtime < cutoffDate) {
                await fs.rm(itemPath, { recursive: true });
                console.log(`  Eliminado backup antiguo: ${item}`);
            }
        }
    } catch (error) {
        console.warn('⚠️  Error limpiando backups antiguos:', error.message);
    }
}

// Ejecutar backup
if (require.main === module) {
    createBackup();
}

module.exports = { createBackup };
