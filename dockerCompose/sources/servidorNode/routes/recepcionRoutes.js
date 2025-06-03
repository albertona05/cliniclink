const express = require('express');
const router = express.Router();
const recepcionController = require('../controllers/recepcionController');
const authMiddleware = require('../middleware/authMiddleware');
/*** 
// Middleware para verificar rol de recepción
const verificarRolRecepcion = (req, res, next) => {
    if (req.usuario && req.usuario.rol === 'recepcion') {
        next();
    } else {
        res.status(403).json({ mensaje: 'Acceso denegado. Se requiere rol de recepción.' });
    }
};*/

// Aplicar middleware de autenticación a todas las rutas
router.use(authMiddleware.verificarToken);

// Rutas para gestión de pacientes
router.get('/pacientes/buscar', recepcionController.buscarPaciente);
router.get('/pacientes/:id', recepcionController.obtenerPaciente);
router.put('/pacientes/:id', recepcionController.actualizarPaciente);
router.post('/pacientes', recepcionController.registrarPaciente);

// Registrar nuevo médico
router.post('/registrar-medico', recepcionController.registrarMedico);

// Rutas para gestión de citas
router.post('/citas', recepcionController.crearCita);

module.exports = router;