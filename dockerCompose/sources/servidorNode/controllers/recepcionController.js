const Usuario = require('../models/usuarioModel');
const Paciente = require('../models/pacienteModel');
const Cita = require('../models/citaModel');
const Factura = require('../models/facturaModel');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const xss = require('xss');

// Función para sanitizar input (prevenir XSS)
const sanitizarInput = (input) => {
    if (typeof input !== 'string') return input;
    return xss(input.trim());
};

// Buscar paciente por DNI o nombre
const buscarPaciente = async (req, res) => {
    try {
        const { busqueda } = req.query;

        // Buscar pacientes que coincidan con DNI o nombre
        const pacientes = await Paciente.findAll({
            include: [{
                model: Usuario,
                as: 'usuario',
                where: {
                    [Op.or]: [
                        { nombre: { [Op.like]: `%${busqueda}%` } }
                    ]
                }
            }],
            where: {
                [Op.or]: [
                    { dni: { [Op.like]: `%${busqueda}%` } }
                ]
            }
        });

        res.json(pacientes.map(paciente => ({
            id: paciente.id_usuario,
            nombre: paciente.usuario.nombre,
            dni: paciente.dni
        })));
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al buscar paciente', error: error.message });
    }
};

// Obtener datos completos de un paciente por ID
const obtenerPaciente = async (req, res) => {
    try {
        const { id } = req.params;

        const paciente = await Paciente.findOne({
            where: { id_usuario: id },
            include: [{
                model: Usuario,
                as: 'usuario',
                attributes: ['nombre', 'email']
            }]
        });

        if (!paciente) {
            return res.status(404).json({ mensaje: 'Paciente no encontrado' });
        }

        res.json({
            id: paciente.id_usuario,
            nombre: paciente.usuario.nombre,
            email: paciente.usuario.email,
            dni: paciente.dni,
            telefono: paciente.telefono,
            fechaNacimiento: paciente.fechaNacimiento,
            direccion: paciente.direccion
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener paciente', error: error.message });
    }
};


// Actualizar datos de un paciente
const actualizarPaciente = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, telefono, direccion } = req.body;

        const paciente = await Paciente.findOne({
            where: { id_usuario: id },
            include: [{ model: Usuario, as: 'usuario' }]
        });

        if (!paciente) {
            return res.status(404).json({ mensaje: 'Paciente no encontrado' });
        }

        // Actualizar datos del usuario
        if (nombre) {
            await paciente.usuario.update({ nombre });
        }

        // Actualizar datos del paciente
        await paciente.update({
            telefono: telefono || paciente.telefono,
            direccion: direccion || paciente.direccion
        });

        res.json({ mensaje: 'Paciente actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar paciente', error: error.message });
    }
};

// Registrar nuevo paciente
const registrarPaciente = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        let { nombre, email, contrasena, dni, telefono, fechaNacimiento, direccion } = req.body;

        // Validar y sanitizar inputs
        nombre = sanitizarInput(nombre);
        email = sanitizarInput(email);
        dni = sanitizarInput(dni);
        telefono = sanitizarInput(telefono);
        direccion = sanitizarInput(direccion);

        // Validacion campos vacios
        if (!nombre || !email || !contrasena || !dni || !telefono || !fechaNacimiento || !direccion) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
        }


        // Verificar duplicados
        const emailExistente = await Usuario.findOne({ where: { email }, transaction: t });
        if (emailExistente) {
            await t.rollback();
            return res.status(400).json({ mensaje: 'El email ya está registrado' });
        }

        const dniExistente = await Paciente.findOne({ where: { dni }, transaction: t });
        if (dniExistente) {
            await t.rollback();
            return res.status(400).json({ mensaje: 'El DNI ya está registrado' });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contrasena, salt);

        // Crear usuario
        const usuario = await Usuario.create({
            nombre,
            email,
            contrasena: hashedPassword,
            rol: 'paciente'
        }, { transaction: t });

        // Crear paciente
        await Paciente.create({
            id_usuario: usuario.id,
            dni,
            telefono,
            fechaNacimiento,
            direccion
        }, { transaction: t });

        await t.commit();
        res.status(201).json({ mensaje: 'Paciente registrado correctamente' });
    } catch (error) {
        await t.rollback();
        console.error('Error al registrar paciente:', error);
        res.status(500).json({ mensaje: 'Error al registrar paciente' });
    }
};

// Crear nueva cita
const crearCita = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { fecha, hora, id_medico, dni_paciente } = req.body;

        // Validar datos requeridos
        if (!fecha || !hora || !id_medico || !dni_paciente) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
        }

        // Buscar paciente por DNI
        const paciente = await Paciente.findOne({
            where: { dni: dni_paciente },
            transaction: t
        });

        if (!paciente) {
            await t.rollback();
            return res.status(404).json({ mensaje: 'Paciente no encontrado' });
        }

        // Verificar si el médico existe
        const medico = await Medico.findByPk(id_medico, { transaction: t });
        if (!medico) {
            await t.rollback();
            return res.status(404).json({ mensaje: 'Médico no encontrado' });
        }

        // Verificar disponibilidad del médico en esa fecha y hora
        const citaExistente = await Cita.findOne({
            where: {
                id_medico: id_medico,
                fecha: fecha,
                hora: hora
            },
            transaction: t
        });

        if (citaExistente) {
            await t.rollback();
            return res.status(400).json({ mensaje: 'El médico ya tiene una cita programada en ese horario' });
        }

        // Crear la cita
        const nuevaCita = await Cita.create({
            id_paciente: paciente.id,
            id_medico: id_medico,
            fecha: fecha,
            hora: hora,
            estado: 'en espera'
        }, { transaction: t });

        await t.commit();
        res.status(201).json({
            mensaje: 'Cita creada correctamente',
            cita: nuevaCita
        });

    } catch (error) {
        await t.rollback();
        console.error('Error al crear cita:', error);
        res.status(500).json({ mensaje: 'Error al crear la cita', error: error.message });
    }
};

module.exports = {
    buscarPaciente,
    obtenerPaciente,
    actualizarPaciente,
    registrarPaciente,
    crearCita
};