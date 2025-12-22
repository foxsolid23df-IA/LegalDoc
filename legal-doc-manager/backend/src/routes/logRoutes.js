const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateId } = require('../middleware/validation');

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener logs de actividad
router.get('/activity', logController.getActivityLogs);

// Obtener actividad reciente
router.get('/recent', logController.getRecentActivity);

// Obtener estadísticas de trabajo
router.get('/statistics', logController.getWorkStatistics);

// Obtener logs por documento
router.get('/document/:documentId',
    validateId,
    logController.getDocumentLogs
);

// Obtener logs por usuario
router.get('/user/:userId',
    validateId,
    logController.getUserLogs
);

module.exports = router;
