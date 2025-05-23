const jwt = require('jsonwebtoken');
const { Usuario, Medico } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || '1234';

// Middleware para verificar token
exports.verificarToken = async (req, res, next) => {
    try {
        // Obtener el token del header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Acceso denegado. Token no proporcionado'
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Buscar usuario con sus relaciones según el rol
        let usuario;
        if (decoded.rol === 'medico') {
            usuario = await Usuario.findByPk(decoded.id, {
                include: [{
                    model: Medico,
                    as: 'medico'
                }]
            });
        } else {
            usuario = await Usuario.findByPk(decoded.id);
        }
        
        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Agregar usuario al request
        req.usuario = usuario;
        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }

        console.error('Error en verificación de token:', error);
        res.status(500).json({
            success: false,
            message: 'Error en la autenticación',
            error: error.message
        });
    }
};

// Middleware para verificar rol de médico
exports.verificarRolMedico = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET);

        if (!decoded.medico_id || decoded.rol !== 'medico') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Se requiere rol de médico.'
            });
        }

        // Asignar el ID del médico desde el token
        req.medicoId = decoded.medico_id;
        next();
    } catch (error) {
        console.error('Error en verificación de rol médico:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar el rol de médico',
            error: error.message
        });
    }
};