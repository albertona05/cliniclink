const express = require('express');
const router = express.Router();
const medicoController = require('../controllers/medicoController');
const authMiddleware = require('../middleware/authMiddleware');

// Rutas protegidas para médicos
router.use(authMiddleware);

// Obtener citas del día
router.post('/citas-dia', medicoController.obtenerCitasDia);

// Anular cita
router.post('/anular-cita', medicoController.anularCita);

// Finalizar cita y generar documentos
router.post('/finalizar-cita', medicoController.finalizarCita);

module.exports = router;