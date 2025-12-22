#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('⚙️  Configuración del Sistema de Gestión Documental Legal\n');

// Función para preguntar al usuario
function askQuestion(question, defaultAnswer = '') {
    return new Promise((resolve) => {
        rl.question(`${question} ${defaultAnswer ? `[${defaultAnswer}] ` : ''}`, (answer) => {
            resolve(answer || defaultAnswer);
        });
    });
}

async function setup() {
    try {
        console.log('1. Configurando variables de entorno...\n');

        // Obtener configuración del usuario
        const port = await askQuestion('Puerto del backend:', '5000');
        const frontendPort = await askQuestion('Puerto del frontend:', '3000');
        const jwtSecret = require('crypto').randomBytes(32).toString('hex');
        const encryptionKey = require('crypto').randomBytes(32).toString('hex');

        // Crear archivo .env
        const envContent = `# Configuración del Sistema Legal
NODE_ENV=development
PORT=${port}
FRONTEND_URL=http://localhost:${frontendPort}
JWT_SECRET=${jwtSecret}
JWT_EXPIRES_IN=8h
DB_PATH=./legal.db
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=52428800 # 50MB
ENCRYPTION_KEY=${encryptionKey}
SESSION_TIMEOUT=3600

# Configuración de email (opcional para notificaciones)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_contraseña
EMAIL_FROM=noreply@legal.com

# Configuración de backup
BACKUP_PATH=./backups
BACKUP_RETENTION_DAYS=30
`;

        fs.writeFileSync(path.join(__dirname, '../.env'), envContent);
        console.log('✓ Archivo .env creado\n');

        console.log('2. Instalando dependencias del backend...\n');
        execSync('npm install', {
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit'
        });
        console.log('✓ Dependencias del backend instaladas\n');

        // Crear directorio de logs
        const logsDir = path.join(__dirname, '../logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
            console.log('✓ Directorio de logs creado');
        }

        console.log('3. Inicializando base de datos...\n');
        const { initializeDatabase } = require('../src/models/initDB');
        await initializeDatabase();
        console.log('✓ Base de datos inicializada\n');

        console.log('4. Creando estructura de directorios...\n');
        const directories = [
            '../uploads',
            '../uploads/documents',
            '../uploads/versions',
            '../uploads/temp',
            '../logs',
            '../backups'
        ];

        directories.forEach(dir => {
            const dirPath = path.join(__dirname, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(`✓ Directorio creado: ${dir}`);
            }
        });

        console.log('\n✅ Configuración completada exitosamente!\n');

        console.log('📋 Información importante:');
        console.log('==========================');
        console.log(`Backend URL: http://localhost:${port}`);
        console.log(`Frontend URL: http://localhost:${frontendPort}`);
        console.log('Usuario administrador por defecto:');
        console.log('  Email: admin@legal.com');
        console.log('  Password: Admin123!');
        console.log('\n⚠️  IMPORTANTE: Cambiar la contraseña del admin después del primer login!');
        console.log('\nPara iniciar el servidor:');
        console.log('  npm run dev');

    } catch (error) {
        console.error('❌ Error durante la configuración:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Ejecutar configuración
setup();
