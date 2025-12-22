const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, validateId, userValidationRules } = require('../middleware/validation');

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de admin
router.get('/',
    authorize(['admin']),
    userController.getAllUsers
);

router.post('/',
    authorize(['admin']),
    userValidationRules.register,
    validate,
    userController.createUser
);

// Rutas específicas de usuario
router.route('/:id')
    .get(validateId, userController.getUserById)
    .put(validateId, userValidationRules.update, validate, userController.updateUser);

// Rutas de administración (solo admin)
router.put('/:id/status',
    authorize(['admin']),
    validateId,
    userController.toggleUserStatus
);

router.put('/:id/reset-password',
    authorize(['admin']),
    validateId,
    userController.resetPassword
);

module.exports = router;
