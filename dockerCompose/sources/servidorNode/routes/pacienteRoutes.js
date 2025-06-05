const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');
const authMiddleware = require('../middleware/authMiddleware');
router.get('/historial/:id', pacienteController.obtenerHistorialPaciente);

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware.verificarToken);

// Rutas para gestión de citas
router.get('/citas/:id', pacienteController.obtenerCitasPaciente);
router.get('/cita/:id', pacienteController.obtenerCitaPorId); // Ruta para obtener una cita específica por ID
router.put('/citas/:id', pacienteController.anularCita);
router.post('/citasPaciente', pacienteController.crearCita);

// Rutas para gestión de facturas
router.get('/facturas/descargar/:id', pacienteController.descargarFactura);
router.get('/facturas/:id', pacienteController.obtenerFacturasPaciente);

// Ruta para obtener paciente por id_usuario
router.get('/usuario/:id', pacienteController.obtenerPacientePorUsuario);

module.exports = router;