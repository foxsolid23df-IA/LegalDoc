const winston = require('winston');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// Definir formatos personalizados
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Crear logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    defaultMeta: { service: 'legal-doc-manager' },
    transports: [
        // Archivo de errores
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        // Archivo combinado
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// En desarrollo, también mostrar logs en consola
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Middleware para Express
const loggerMiddleware = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;

        logger.info({
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            userId: req.user ? req.user.id : null
        });
    });

    next();
};

// Función para registrar actividad específica
function logActivity(activityData) {
    const { userId, action, details, documentId, caseId, ipAddress } = activityData;

    logger.info({
        type: 'activity',
        userId,
        action,
        details,
        documentId,
        caseId,
        ipAddress,
        timestamp: new Date().toISOString()
    });
}

// Función para registrar errores de seguridad
function logSecurityEvent(eventData) {
    const { type, userId, ipAddress, details, severity = 'medium' } = eventData;

    logger.warn({
        type: 'security',
        securityType: type,
        userId,
        ipAddress,
        details,
        severity,
        timestamp: new Date().toISOString()
    });
}

module.exports = {
    logger,
    loggerMiddleware,
    logActivity,
    logSecurityEvent
};
