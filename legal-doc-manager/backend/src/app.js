const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Configuración de entorno
dotenv.config();

// Importar rutas fusionadas
const empresasRoutes = require('./api/v1/empresas/routes');
const unidadesCasosRoutes = require('./api/v1/unidades-casos/routes');
const documentosRoutes = require('./api/v1/documentos/routes');
const transaccionesRoutes = require('./api/v1/transacciones/routes');
const reportesRoutes = require('./api/v1/reportes/routes');
const usuariosRoutes = require('./api/v1/usuarios/routes');

// Middleware de autenticación unificado
const { authenticate, authorize } = require('./api/middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');
const { loggerMiddleware } = require('./middleware/logger');

const app = express();

// Configuración de Seguridad y Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(loggerMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000
});
app.use('/api/', limiter);

// Servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ----------------------------------------------------------------------
// Rutas API (Arquitectura Fusionada v1)
// ----------------------------------------------------------------------

// Rutas Públicas
app.use('/api/v1/auth', require('./api/v1/auth/routes'));

// Rutas Protegidas
app.use('/api/v1/empresas', authenticate, authorize(['admin', 'abogado', 'gerente']), empresasRoutes);
app.use('/api/v1/unidades-casos', authenticate, authorize(['admin', 'abogado', 'asistente']), unidadesCasosRoutes);
app.use('/api/v1/documentos', authenticate, authorize(['admin', 'abogado', 'asistente']), documentosRoutes);
app.use('/api/v1/transacciones', authenticate, authorize(['admin', 'contador', 'gerente']), transaccionesRoutes);
app.use('/api/v1/reportes', authenticate, authorize(['admin', 'gerente']), reportesRoutes);
app.use('/api/v1/usuarios', authenticate, authorize(['admin']), usuariosRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Legal Document Manager API v1 (Fusionado)'
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// ----------------------------------------------------------------------
// Inicialización del Servidor
// ----------------------------------------------------------------------
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  // Inicializar base de datos
  const getDatabase = require('./models/database');
  const db = getDatabase();

  db.connect()
    .then(() => {
      const server = app.listen(PORT, () => {
        console.log(`Servidor (Fusionado) corriendo en puerto ${PORT}`);
        console.log(`Entorno: ${process.env.NODE_ENV}`);
        console.log(`API v1 Base: http://localhost:${PORT}/api/v1`);
      });

      // Configurar Socket.io (desde src/sockets/index.js)
      try {
        require('./sockets').initialize(server);
      } catch (err) {
        console.warn('Socket.io warning:', err.message);
      }
    })
    .catch(err => {
      console.error('Error fatal al iniciar la aplicación:', err);
      process.exit(1);
    });
}

module.exports = app;
