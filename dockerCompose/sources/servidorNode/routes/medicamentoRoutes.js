const express = require('express');
const router = express.Router();
const medicamentoController = require('../controllers/medicamentoController');
const authMiddleware = require('../middleware/authMiddleware');

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware.verificarToken);

// Obtener todos los medicamentos
router.get('/medicamentos', medicamentoController.obtenerMedicamentos);

// Crear un nuevo medicamento (solo para administradores o médicos)
router.post('/medicamentos', medicamentoController.crearMedicamento);

module.exports = router;