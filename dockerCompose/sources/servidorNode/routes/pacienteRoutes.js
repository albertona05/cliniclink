const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');
const authMiddleware = require('../middleware/authMiddleware');
router.get('/historial/:id', pacienteController.obtenerHistorialPaciente);

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware.verificarToken);

// Rutas para gestión de citas
router.get('/citas/:id', pacienteController.obtenerCitasPaciente);
router.put('/citas/:id', pacienteController.anularCita);
router.post('/citasPaciente', pacienteController.crearCita);

// Rutas para gestión de facturas
router.get('/facturas/:id', pacienteController.obtenerFacturasPaciente);


module.exports = router;