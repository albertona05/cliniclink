const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken } = require('../middleware/authMiddleware');

// Ruta login
router.post('/login', authController.login);

// Ruta para cerrar sesión (protegida)
router.post('/logout', verificarToken, authController.cerrarSesion);

// Ruta protegida de ejemplo
router.get('/perfil', verificarToken, (req, res) => {
    res.json({
        success: true,
        usuario: {
            id: req.usuario.id,
            nombre: req.usuario.nombre,
            email: req.usuario.email,
            rol: req.usuario.rol
        }
    });
});

module.exports = router;