const express = require('express');
const router = express.Router();
const medicoController = require('../controllers/medicoController');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware.verificarToken);

// Obtener citas del día
router.post('/citas-dia', medicoController.obtenerCitasDia);

// Anular cita
router.post('/anular-cita', medicoController.anularCita);

// Finalizar cita y generar documentos
router.post('/finalizar-cita', medicoController.finalizarCita);

module.exports = router;