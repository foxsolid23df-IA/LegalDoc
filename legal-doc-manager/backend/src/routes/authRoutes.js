const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { userValidationRules } = require('../middleware/validation');

// Rutas públicas
router.post('/register',
    userValidationRules.register,
    validate,
    authenticate, // Solo usuarios autenticados (admin) pueden registrar
    authController.register
);

router.post('/login',
    userValidationRules.login,
    validate,
    authController.login
);

// Rutas protegidas
router.get('/profile',
    authenticate,
    authController.getProfile
);

router.put('/profile',
    authenticate,
    userValidationRules.update,
    validate,
    authController.updateProfile
);

router.put('/change-password',
    authenticate,
    userValidationRules.changePassword,
    validate,
    authController.changePassword
);

router.post('/logout',
    authenticate,
    authController.logout
);

router.get('/verify',
    authenticate,
    authController.verifyToken
);

module.exports = router;
