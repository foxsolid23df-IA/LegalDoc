const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authenticate, authorize, checkPermission } = require('../middleware/auth');
const { validate, validateId, documentValidationRules } = require('../middleware/validation');
const fileHandler = require('../utils/fileHandler');

// Configurar multer para subida de archivos
const upload = fileHandler.getMulterConfig();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Listar documentos (con búsqueda/filtros opcionales)
router.get('/',
    documentValidationRules.search,
    validate,
    documentController.searchDocuments
);

// Subir documento
router.post('/upload',
    checkPermission('full'),
    upload.single('document'),
    documentValidationRules.create,
    validate,
    documentController.uploadDocument
);

// Rutas con ID de documento
router.route('/:id')
    .get(validateId, documentController.getDocument)
    .put(
        validateId,
        checkPermission('editor'),
        documentValidationRules.update,
        validate,
        documentController.updateDocument
    )
    .delete(validateId, checkPermission('full'), documentController.deleteDocument);

// Bloquear/liberar documento
router.post('/:id/lock',
    validateId,
    checkPermission('editor'),
    documentController.lockDocument
);

router.post('/:id/unlock',
    validateId,
    checkPermission('editor'),
    documentController.unlockDocument
);

// Descargar documento
router.get('/:id/download',
    validateId,
    documentController.downloadDocument
);

// Obtener estado de bloqueo
router.get('/:id/lock-status',
    validateId,
    documentController.getDocumentLockStatus
);

// Versiones
router.get('/:id/versions',
    validateId,
    documentController.getDocumentVersions
);

// Compartir documento
router.post('/:id/share',
    validateId,
    checkPermission('full'),
    documentValidationRules.share,
    validate,
    documentController.shareDocument
);

router.get('/:id/shares',
    validateId,
    documentController.getDocumentShares
);

router.delete('/:id/share/:userId',
    validateId,
    checkPermission('full'),
    documentController.revokeShare
);

// Búsqueda
router.get('/search',
    documentValidationRules.search,
    validate,
    documentController.searchDocuments
);

// Documentos por caso
router.get('/case/:caseId',
    documentController.getDocumentsByCase
);

module.exports = router;
