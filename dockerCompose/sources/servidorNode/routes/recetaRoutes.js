const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware.verificarToken);

// Rutas para gestión de recetas médicas
router.get('/recetas/descargar/:id', pacienteController.descargarReceta);

module.exports = router;