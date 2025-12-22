const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const dotenv = require('dotenv');
const encryption = require('./encryption');

dotenv.config();

class FileHandler {
    constructor() {
        this.uploadPath = process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads');
        this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024; // 50MB

        // Crear directorios necesarios
        this.initDirectories();
    }

    async initDirectories() {
        const directories = [
            this.uploadPath,
            path.join(this.uploadPath, 'documents'),
            path.join(this.uploadPath, 'versions'),
            path.join(this.uploadPath, 'temp')
        ];

        for (const dir of directories) {
            try {
                await fs.access(dir);
            } catch {
                await fs.mkdir(dir, { recursive: true });
            }
        }
    }

    // Configurar multer para subida de archivos
    getMulterConfig() {
        const storage = multer.diskStorage({
            destination: async (req, file, cb) => {
                const tempDir = path.join(this.uploadPath, 'temp');
                await fs.mkdir(tempDir, { recursive: true });
                cb(null, tempDir);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                cb(null, uniqueSuffix + '-' + safeName);
            }
        });

        const fileFilter = (req, file, cb) => {
            // Lista de extensiones permitidas
            const allowedExtensions = [
                '.pdf', '.doc', '.docx', '.txt', '.rtf',
                '.xls', '.xlsx', '.ppt', '.pptx',
                '.jpg', '.jpeg', '.png', '.gif'
            ];

            const ext = path.extname(file.originalname).toLowerCase();

            if (allowedExtensions.includes(ext)) {
                cb(null, true);
            } else {
                cb(new Error(`Tipo de archivo no permitido. Extensiones permitidas: ${allowedExtensions.join(', ')}`));
            }
        };

        return multer({
            storage: storage,
            fileFilter: fileFilter,
            limits: {
                fileSize: this.maxFileSize
            }
        });
    }

    // Procesar archivo subido
    async processUploadedFile(tempFilePath, userId, documentData) {
        try {
            // Generar nombre único para el archivo final
            const fileId = crypto.randomBytes(8).toString('hex');
            const originalExt = path.extname(documentData.nombre_original);
            const finalFilename = `doc_${userId}_${fileId}${originalExt}`;
            const finalPath = path.join(this.uploadPath, 'documents', finalFilename);

            // Generar hash del archivo original
            const hash = await encryption.generateFileHash(tempFilePath);

            // Encriptar archivo
            await encryption.encryptFile(tempFilePath, finalPath);

            // Eliminar archivo temporal
            await fs.unlink(tempFilePath);

            return {
                nombre_archivo: finalFilename,
                ruta_fisica: finalPath,
                hash_archivo: hash,
                extension: originalExt.substring(1),
                tamaño_bytes: (await fs.stat(finalPath)).size
            };
        } catch (error) {
            // Limpiar archivo temporal en caso de error
            try {
                await fs.unlink(tempFilePath);
            } catch (cleanupError) {
                console.warn('Error limpiando archivo temporal:', cleanupError.message);
            }
            throw error;
        }
    }

    // Crear nueva versión de archivo
    async createVersion(originalFilePath, userId, documentId, version) {
        try {
            const fileId = crypto.randomBytes(4).toString('hex');
            const ext = path.extname(originalFilePath);
            const versionFilename = `doc_${documentId}_v${version}_${fileId}${ext}`;
            const versionPath = path.join(this.uploadPath, 'versions', versionFilename);

            // Encriptar versión
            await encryption.encryptFile(originalFilePath, versionPath);

            // Generar hash de la versión
            const hash = await encryption.generateFileHash(originalFilePath);

            return {
                ruta_fisica: versionPath,
                hash_version: hash
            };
        } catch (error) {
            throw error;
        }
    }

    // Obtener archivo para lectura
    async getFileForReading(filePath, outputPath) {
        try {
            // Verificar que el archivo existe
            await fs.access(filePath);

            // Desencriptar archivo a ubicación temporal
            await encryption.decryptFile(filePath, outputPath);

            return outputPath;
        } catch (error) {
            throw new Error(`Error obteniendo archivo: ${error.message}`);
        }
    }

    // Eliminar archivo físico
    async deleteFile(filePath) {
        try {
            await fs.unlink(filePath);
            return true;
        } catch (error) {
            console.warn(`Error eliminando archivo ${filePath}:`, error.message);
            return false;
        }
    }

    // Limpiar archivos temporales antiguos
    async cleanupTempFiles(maxAgeHours = 24) {
        try {
            const tempDir = path.join(this.uploadPath, 'temp');
            const files = await fs.readdir(tempDir);
            const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);

            let deletedCount = 0;

            for (const file of files) {
                const filePath = path.join(tempDir, file);
                const stats = await fs.stat(filePath);

                if (stats.mtimeMs < cutoffTime) {
                    await fs.unlink(filePath);
                    deletedCount++;
                }
            }

            return deletedCount;
        } catch (error) {
            console.warn('Error limpiando archivos temporales:', error.message);
            return 0;
        }
    }

    // Verificar espacio disponible
    async checkStorageSpace() {
        try {
            // Esta es una implementación básica
            // En producción, considerar usar librerías específicas del sistema operativo
            const stats = await fs.stat(this.uploadPath);

            // Simulación: asumir 10GB disponible
            // En implementación real, usar require('diskusage') o similar
            return {
                used: await this.getDirectorySize(this.uploadPath),
                total: 10 * 1024 * 1024 * 1024, // 10GB
                available: 9 * 1024 * 1024 * 1024 // 9GB
            };
        } catch (error) {
            console.warn('Error verificando espacio:', error.message);
            return null;
        }
    }

    // Calcular tamaño de directorio
    async getDirectorySize(dirPath) {
        let totalSize = 0;

        try {
            const items = await fs.readdir(dirPath);

            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                const stats = await fs.stat(itemPath);

                if (stats.isDirectory()) {
                    totalSize += await this.getDirectorySize(itemPath);
                } else {
                    totalSize += stats.size;
                }
            }
        } catch (error) {
            console.warn(`Error calculando tamaño de ${dirPath}:`, error.message);
        }

        return totalSize;
    }

    // Validar tipo MIME
    static getMimeType(extension) {
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.txt': 'text/plain',
            '.rtf': 'application/rtf',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif'
        };

        return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
    }

    // Sanitizar nombre de archivo
    static sanitizeFilename(filename) {
        return filename
            .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.\-_]/g, '_')
            .replace(/\s+/g, '_')
            .substring(0, 255);
    }
}

module.exports = new FileHandler();
