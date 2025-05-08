const express = require('express');
const router = express.Router();
const medicoController = require('../controllers/medicoController');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware.verificarToken);

// Obtener citas del día
router.post('/citas-dia', medicoController.obtenerCitasDia);

// Finalizar cita y generar documentos
router.post('/finalizar-cita', medicoController.finalizarCita);

module.exports = router;