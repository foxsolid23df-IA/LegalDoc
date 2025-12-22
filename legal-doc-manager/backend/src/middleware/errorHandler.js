const { logger } = require('../utils/logger');

// Clase para errores personalizados
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Manejo de errores global
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log del error
    logger.error({
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userId: req.user ? req.user.id : null
    });

    // En desarrollo, enviar detalles completos
    if (process.env.NODE_ENV === 'development') {
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }

    // En producción, enviar mensajes genéricos para errores operacionales
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            status: err.status,
            message: err.message
        });
    }

    // Para errores desconocidos, enviar mensaje genérico
    return res.status(500).json({
        success: false,
        status: 'error',
        message: 'Algo salió mal. Por favor intente nuevamente más tarde.'
    });
};

// Middleware para rutas no encontradas
const notFoundHandler = (req, res, next) => {
    const error = new AppError(`No se encontró ${req.originalUrl} en este servidor`, 404);
    next(error);
};

// Wrapper para manejar errores en async functions
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

module.exports = {
    AppError,
    errorHandler,
    notFoundHandler,
    catchAsync
};
