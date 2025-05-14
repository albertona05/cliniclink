const express = require('express');
const router = express.Router();
const globalController = require('../controllers/globalController');
const authMiddleware = require('../middleware/authMiddleware');

//Funcionamiento
router.get('/', globalController.funciona);

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware.verificarToken);

// Rutas para gestión de médicos y disponibilidad
router.get('/medicos', globalController.obtenerMedicos);
router.get('/medicos/horas-libres', globalController.obtenerHorasLibres);

module.exports = router;