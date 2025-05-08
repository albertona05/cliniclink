const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware.verificarToken);

// Rutas para gestión de citas
router.post('/citas', pacienteController.crearCita);
router.get('/citas/:id', pacienteController.obtenerCitasPaciente);
router.put('/citas/:id', pacienteController.anularCita);

// Rutas para gestión de facturas
router.get('/facturas/:id', pacienteController.obtenerFacturasPaciente);

// Rutas para gestión de facturas
router.get('/historial/:id', pacienteController.obtenerHistorialPaciente);

module.exports = router;