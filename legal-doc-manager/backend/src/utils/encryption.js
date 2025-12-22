const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

class Encryption {
    constructor() {
        this.encryptionKey = process.env.ENCRYPTION_KEY || 'default_key_change_in_production_32bytes';

        if (this.encryptionKey.length < 32) {
            console.warn('La clave de encriptación es muy corta. Usando clave derivada...');
            this.encryptionKey = crypto.createHash('sha256').update(this.encryptionKey).digest('hex').substring(0, 32);
        } else if (this.encryptionKey.length > 32) {
            this.encryptionKey = this.encryptionKey.substring(0, 32);
        }
    }

    // Generar hash para verificación de integridad
    static async generateFileHash(filePath) {
        try {
            const fileBuffer = await fs.readFile(filePath);
            const hash = crypto.createHash('sha256');
            hash.update(fileBuffer);
            return hash.digest('hex');
        } catch (error) {
            throw new Error(`Error generando hash: ${error.message}`);
        }
    }

    static generateStringHash(content) {
        const hash = crypto.createHash('sha256');
        hash.update(content);
        return hash.digest('hex');
    }

    // Encriptar archivo
    async encryptFile(inputPath, outputPath) {
        try {
            const fileBuffer = await fs.readFile(inputPath);
            const encrypted = CryptoJS.AES.encrypt(
                CryptoJS.lib.WordArray.create(fileBuffer),
                this.encryptionKey
            ).toString();

            await fs.writeFile(outputPath, encrypted, 'utf8');
            return true;
        } catch (error) {
            throw new Error(`Error encriptando archivo: ${error.message}`);
        }
    }

    // Desencriptar archivo
    async decryptFile(inputPath, outputPath) {
        try {
            const encryptedContent = await fs.readFile(inputPath, 'utf8');
            const decrypted = CryptoJS.AES.decrypt(encryptedContent, this.encryptionKey);
            const buffer = Buffer.from(decrypted.toString(CryptoJS.enc.Base64), 'base64');

            await fs.writeFile(outputPath, buffer);
            return true;
        } catch (error) {
            throw new Error(`Error desencriptando archivo: ${error.message}`);
        }
    }

    // Encriptar texto
    encryptText(text) {
        try {
            return CryptoJS.AES.encrypt(text, this.encryptionKey).toString();
        } catch (error) {
            throw new Error(`Error encriptando texto: ${error.message}`);
        }
    }

    // Desencriptar texto
    decryptText(encryptedText) {
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedText, this.encryptionKey);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch (error) {
            throw new Error(`Error desencriptando texto: ${error.message}`);
        }
    }

    // Generar IV (Initialization Vector)
    static generateIV() {
        return crypto.randomBytes(16).toString('hex');
    }

    // Verificar integridad de archivo
    static async verifyFileIntegrity(filePath, expectedHash) {
        try {
            const actualHash = await this.generateFileHash(filePath);
            return actualHash === expectedHash;
        } catch (error) {
            return false;
        }
    }

    // Generar token de sesión seguro
    static generateSessionToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Hash seguro para contraseñas (usando bcrypt en otro lugar, esta es adicional)
    static async hashPassword(password) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto
            .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
            .toString('hex');
        return `${salt}:${hash}`;
    }

    static async verifyPassword(password, storedHash) {
        const [salt, originalHash] = storedHash.split(':');
        const hash = crypto
            .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
            .toString('hex');
        return hash === originalHash;
    }
}

module.exports = new Encryption();
