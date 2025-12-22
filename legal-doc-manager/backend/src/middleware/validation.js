const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('./errorHandler');

// Validar resultados de validación
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => ({
            field: err.param,
            message: err.msg,
            value: err.value
        }));

        throw new AppError('Error de validación', 400, errorMessages);
    }

    next();
};

// Reglas de validación para usuarios
const userValidationRules = {
    register: [
        body('email')
            .isEmail().withMessage('Email inválido')
            .normalizeEmail(),
        body('password')
            .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
            .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula')
            .matches(/[a-z]/).withMessage('La contraseña debe contener al menos una minúscula')
            .matches(/[0-9]/).withMessage('La contraseña debe contener al menos un número')
            .matches(/[^A-Za-z0-9]/).withMessage('La contraseña debe contener al menos un carácter especial'),
        body('nombre')
            .trim()
            .notEmpty().withMessage('El nombre es requerido')
            .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres'),
        body('apellido')
            .trim()
            .notEmpty().withMessage('El apellido es requerido')
            .isLength({ max: 100 }).withMessage('El apellido no puede exceder 100 caracteres'),
        body('rol')
            .optional()
            .isIn(['admin', 'abogado', 'asistente']).withMessage('Rol inválido'),
        body('permisos')
            .optional()
            .isIn(['lectura', 'editor', 'full']).withMessage('Permisos inválidos')
    ],

    login: [
        body('email')
            .isEmail().withMessage('Email inválido')
            .normalizeEmail(),
        body('password')
            .notEmpty().withMessage('La contraseña es requerida')
    ],

    update: [
        body('nombre')
            .optional()
            .trim()
            .isLength({ max: 100 }).withMessage('El nombre no puede exceder 100 caracteres'),
        body('apellido')
            .optional()
            .trim()
            .isLength({ max: 100 }).withMessage('El apellido no puede exceder 100 caracteres'),
        body('rol')
            .optional()
            .isIn(['admin', 'abogado', 'asistente']).withMessage('Rol inválido'),
        body('permisos')
            .optional()
            .isIn(['lectura', 'editor', 'full']).withMessage('Permisos inválidos'),
        body('activo')
            .optional()
            .isBoolean().withMessage('Activo debe ser verdadero o falso')
    ],

    changePassword: [
        body('currentPassword')
            .notEmpty().withMessage('La contraseña actual es requerida'),
        body('newPassword')
            .isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres')
            .matches(/[A-Z]/).withMessage('La nueva contraseña debe contener al menos una mayúscula')
            .matches(/[a-z]/).withMessage('La nueva contraseña debe contener al menos una minúscula')
            .matches(/[0-9]/).withMessage('La nueva contraseña debe contener al menos un número')
            .matches(/[^A-Za-z0-9]/).withMessage('La nueva contraseña debe contener al menos un carácter especial')
            .custom((value, { req }) => {
                if (value === req.body.currentPassword) {
                    throw new Error('La nueva contraseña no puede ser igual a la actual');
                }
                return true;
            })
    ]
};

// Reglas de validación para documentos
const documentValidationRules = {
    create: [
        body('nombre_original')
            .trim()
            .notEmpty().withMessage('El nombre del documento es requerido')
            .isLength({ max: 255 }).withMessage('El nombre no puede exceder 255 caracteres'),
        body('tipo_documento')
            .isIn(['contrato', 'demanda', 'fianza', 'reporte', 'correspondencia', 'evidencia', 'otro'])
            .withMessage('Tipo de documento inválido'),
        body('confidencialidad')
            .optional()
            .isInt({ min: 1, max: 5 }).withMessage('La confidencialidad debe ser entre 1 y 5'),
        body('caso_id')
            .optional()
            .isInt().withMessage('ID de caso inválido')
    ],

    update: [
        body('nombre_original')
            .optional()
            .trim()
            .isLength({ max: 255 }).withMessage('El nombre no puede exceder 255 caracteres'),
        body('tipo_documento')
            .optional()
            .isIn(['contrato', 'demanda', 'fianza', 'reporte', 'correspondencia', 'evidencia', 'otro'])
            .withMessage('Tipo de documento inválido'),
        body('confidencialidad')
            .optional()
            .isInt({ min: 1, max: 5 }).withMessage('La confidencialidad debe ser entre 1 y 5'),
        body('caso_id')
            .optional()
            .isInt().withMessage('ID de caso inválido')
    ],

    share: [
        body('usuario_id')
            .isInt().withMessage('ID de usuario inválido'),
        body('permisos')
            .isIn(['lectura', 'editor']).withMessage('Permisos inválidos'),
        body('fecha_expiracion')
            .optional()
            .isISO8601().withMessage('Fecha de expiración inválida')
            .custom((value) => {
                if (new Date(value) <= new Date()) {
                    throw new Error('La fecha de expiración debe ser futura');
                }
                return true;
            })
    ],

    search: [
        query('q')
            .optional()
            .trim()
            .isLength({ max: 200 }).withMessage('La búsqueda no puede exceder 200 caracteres'),
        query('tipo_documento')
            .optional()
            .isIn(['contrato', 'demanda', 'fianza', 'reporte', 'correspondencia', 'evidencia', 'otro'])
            .withMessage('Tipo de documento inválido'),
        query('caso_id')
            .optional()
            .isInt().withMessage('ID de caso inválido'),
        query('fecha_desde')
            .optional()
            .isISO8601().withMessage('Fecha desde inválida'),
        query('fecha_hasta')
            .optional()
            .isISO8601().withMessage('Fecha hasta inválida'),
        query('confidencialidad_max')
            .optional()
            .isInt({ min: 1, max: 5 }).withMessage('Confidencialidad máxima debe ser entre 1 y 5')
    ]
};

// Reglas de validación para casos
const caseValidationRules = {
    create: [
        body('numero_caso')
            .trim()
            .notEmpty().withMessage('El número de caso es requerido')
            .isLength({ max: 50 }).withMessage('El número de caso no puede exceder 50 caracteres'),
        body('titulo')
            .trim()
            .notEmpty().withMessage('El título es requerido')
            .isLength({ max: 200 }).withMessage('El título no puede exceder 200 caracteres'),
        body('cliente_id')
            .optional()
            .isInt().withMessage('ID de cliente inválido'),
        body('abogado_responsable')
            .optional()
            .isInt().withMessage('ID de abogado inválido'),
        body('prioridad')
            .optional()
            .isIn(['baja', 'media', 'alta', 'urgente']).withMessage('Prioridad inválida'),
        body('estado')
            .optional()
            .isLength({ max: 30 }).withMessage('El estado no puede exceder 30 caracteres')
    ]
};

// Middleware para validar IDs
const validateId = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID inválido'),
    validate
];

module.exports = {
    validate,
    userValidationRules,
    documentValidationRules,
    caseValidationRules,
    validateId
};
