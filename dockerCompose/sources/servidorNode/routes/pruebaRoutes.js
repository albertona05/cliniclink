const express = require('express');
const router = express.Router();
const pruebaController = require('../controllers/pruebaController');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware para verificar autenticación
router.use(authMiddleware.verificarToken);

// Rutas para gestión de pruebas médicas
router.post('/pruebas', authMiddleware.verificarRolMedico, pruebaController.crearPrueba);
router.post('/pruebas/finalizar', authMiddleware.verificarRolMedico, pruebaController.finalizarPrueba);
router.get('/pruebas/solicitadas', authMiddleware.verificarRolMedico, pruebaController.obtenerPruebasSolicitadas);

module.exports = router;