const Usuario = require('../models/usuarioModel');
const Paciente = require('../models/pacienteModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sequelize = require('../config/database');
const rateLimit = require('express-rate-limit');
const xss = require('xss');

// Configuración del JWT
const JWT_SECRET = process.env.JWT_SECRET || '1234';
const JWT_EXPIRES_IN = '24h';

// Configuración de límites de intentos
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // límite de 5 intentos por ventana
    message: { success: false, message: 'Demasiados intentos de inicio de sesión. Por favor, intente más tarde.' }
});

// Función para sanitizar input
const sanitizarInput = (input) => {
    if (typeof input !== 'string') return input;
    return xss(input.trim());
};

// Función para iniciar sesión
exports.login = async (req, res) => {
    try {
        const email = sanitizarInput(req.body.email);
        const contrasena = req.body.contrasena;

        // Validar datos requeridos y formato
        if (!email || !contrasena) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos',
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de email inválido',
            });
        }

        // Validar longitud de contraseña
        if (contrasena.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 8 caracteres',
            });
        }

        // Buscar usuario
        const usuario = await Usuario.findOne({ where: { email } });
        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas. Por favor, verifique su email y contraseña.',
            });
        }

        // Verificar contraseña
        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!contrasenaValida) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas. Por favor, verifique su email y contraseña.',
            });
        }

        // Generar JWT
        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, rol: usuario.rol },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            message: 'Login exitoso',
            token
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión. Intente nuevamente más tarde.'
        });
    }
};

// Función para cerrar sesión
exports.cerrarSesion = async (req, res) => {
    try {
        // Limpiar la cookie del token si existe
        if (req.cookies && req.cookies.token) {
            res.clearCookie('token');
        }

        res.status(200).json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cerrar sesión. Intente nuevamente más tarde.',
            error: error.message
        });
    }
};