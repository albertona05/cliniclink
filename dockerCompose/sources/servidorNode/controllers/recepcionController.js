const { Usuario, Paciente, Cita, Factura, Medico } = require('../models');
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
        let { busqueda } = req.query;

        // Validar que exista el parámetro de búsqueda
        if (!busqueda) {
            return res.status(400).json({ 
                success: false,
                mensaje: 'El parámetro de búsqueda es requerido' 
            });
        }

        // Sanitizar el parámetro de búsqueda
        busqueda = sanitizarInput(busqueda);
        
        // Verificar si la búsqueda parece ser un DNI (8 dígitos seguidos de una letra)
        const esDNI = /^\d{8}[A-Za-z]$/.test(busqueda);
        
        let consulta = {};
        
        if (esDNI) {
            consulta = {
                include: [{
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['nombre']
                }],
                where: {
                    dni: {
                        [Op.like]: `%${busqueda}%`
                    }
                }
            };
        } else {
            consulta = {
                include: [{
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['nombre'],
                    where: {
                        nombre: {
                            [Op.like]: `%${busqueda}%`
                        }
                    }
                }]
            };
        }
        
        const pacientes = await Paciente.findAll(consulta);
        
        if (pacientes.length === 0) {
            console.log('No se encontraron pacientes con el criterio de búsqueda');
        } else {
            console.log('Pacientes encontrados:', JSON.stringify(pacientes.map(p => ({ 
                id: p.id_usuario, 
                nombre: p.usuario?.nombre || 'Sin nombre', 
                dni: p.dni 
            })), null, 2));
        }

        const resultado = pacientes.map(paciente => ({
            id: paciente.id_usuario,
            nombre: paciente.usuario?.nombre || 'Sin nombre',
            dni: paciente.dni
        }));

        res.status(200).json({
            success: true,
            data: resultado
        });
    } catch (error) {
        console.error('Error al buscar paciente:', error);
        console.error('Stack de error:', error.stack);
        res.status(500).json({ 
            success: false,
            mensaje: 'Error al buscar paciente',
            error: error.message 
        });
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

        console.log("Solicitud recibida para obtener paciente con ID:", id);
        if (!paciente) {
            console.log("Paciente no encontrado para ID:", id);
            return res.status(404).json({ mensaje: 'Paciente no encontrado' });
        }
        console.log("Paciente encontrado:", {
            id: paciente.id_usuario,
            nombre: paciente.usuario.nombre,
            email: paciente.usuario.email,
            dni: paciente.dni,
            telefono: paciente.telefono,
            fechaNacimiento: paciente.fechaNacimiento,
            direccion: paciente.direccion
        });
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

        res.json({ success: true, mensaje: 'Paciente actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ success: false, mensaje: 'Error al actualizar paciente', error: error.message });
    }
};

// Registrar nuevo paciente
const registrarPaciente = async (req, res) => {
    let t;
    try {
        t = await sequelize.transaction();
        
        let { nombre, email, dni, telefono, fechaNacimiento, direccion } = req.body;

        // Validar y sanitizar inputs
        nombre = sanitizarInput(nombre);
        email = sanitizarInput(email);
        dni = sanitizarInput(dni);
        telefono = sanitizarInput(telefono);
        direccion = sanitizarInput(direccion);

        // Validacion campos vacios
        if (!nombre || !email || !dni || !telefono || !fechaNacimiento || !direccion) {
            await t.rollback();
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

        // Generar contraseña automática: primera letra del nombre + primera letra del primer apellido + primera letra del segundo apellido + año de nacimiento
        try {
            // Dividir el nombre completo en partes
            const nombrePartes = nombre.split(' ');
            let contrasena = '';
            
            // Obtener primera letra del nombre
            if (nombrePartes.length > 0) {
                contrasena += nombrePartes[0].charAt(0).toLowerCase();
            }
            
            // Obtener primera letra del primer apellido
            if (nombrePartes.length > 1) {
                contrasena += nombrePartes[1].charAt(0).toLowerCase();
            }
            
            // Obtener primera letra del segundo apellido
            if (nombrePartes.length > 2) {
                contrasena += nombrePartes[2].charAt(0).toLowerCase();
            }
            
            // Obtener año de nacimiento
            const fechaNac = new Date(fechaNacimiento);
            const anioNacimiento = fechaNac.getFullYear();
            contrasena += anioNacimiento;
            
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
            const pacienteCreado = await Paciente.create({
                id_usuario: usuario.id,
                dni,
                telefono,
                fechaNacimiento,
                direccion
            }, { transaction: t });

            await t.commit();
            res.status(201).json({ 
                mensaje: 'Paciente registrado correctamente', 
                contrasenaGenerada: contrasena // Devolver la contraseña generada para que el usuario la conozca
            });
        } catch (encryptError) {
            console.error('Error durante la generación de contraseña o creación de registros:', encryptError);
            console.error('Stack de error:', encryptError.stack);
            throw encryptError;
        }
    } catch (error) {
        if (t) await t.rollback();
        console.error('=== ERROR: Registro de paciente fallido ===');
        console.error('Error al registrar paciente:', error);
        console.error('Mensaje de error:', error.message);
        console.error('Stack de error:', error.stack);
        
        if (error.name === 'SequelizeValidationError') {
            console.error('Error de validación de Sequelize:', error.errors.map(e => e.message));
            return res.status(400).json({ 
                mensaje: 'Error de validación', 
                errores: error.errors.map(e => e.message) 
            });
        }
        
        if (error.name === 'SequelizeDatabaseError') {
            console.error('Error de base de datos:', error.parent?.sqlMessage || error.message);
        }
        
        res.status(500).json({ 
            mensaje: 'Error al registrar paciente', 
            error: error.message 
        });
    }
};

// Crear nueva cita
const crearCita = async (req, res) => {
    console.log('=== INICIO: Creación de nueva cita ===');
    console.log('Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    let t;
    try {
        t = await sequelize.transaction();
        console.log('Transacción iniciada correctamente');
        
        const { fecha, hora, id_medico, dni_paciente } = req.body;
        console.log('Datos extraídos del body:', { fecha, hora, id_medico, dni_paciente });

        // Validar datos requeridos
        if (!fecha || !hora || !id_medico || !dni_paciente) {
            console.log('Error: Campos vacíos detectados', { 
                fecha: !!fecha, 
                hora: !!hora, 
                id_medico: !!id_medico, 
                dni_paciente: !!dni_paciente 
            });
            await t.rollback();
            console.log('Transacción cancelada: campos vacíos');
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
        }
        console.log('Validación de campos vacíos: OK');

        // Buscar paciente por DNI
        console.log('Buscando paciente con DNI:', dni_paciente);
        const paciente = await Paciente.findOne({
            where: { dni: dni_paciente },
            transaction: t
        });

        if (!paciente) {
            console.log('Paciente no encontrado con DNI:', dni_paciente);
            await t.rollback();
            console.log('Transacción cancelada: paciente no encontrado');
            return res.status(404).json({ mensaje: 'Paciente no encontrado' });
        }
        console.log('Paciente encontrado con ID:', paciente.id);

        // Verificar si el médico existe
        console.log('Verificando existencia del médico con ID:', id_medico);
        const medico = await Medico.findByPk(id_medico, { transaction: t });
        if (!medico) {
            console.log('Médico no encontrado con ID:', id_medico);
            await t.rollback();
            console.log('Transacción cancelada: médico no encontrado');
            return res.status(404).json({ mensaje: 'Médico no encontrado' });
        }
        console.log('Médico encontrado correctamente');

        // Verificar disponibilidad del médico en esa fecha y hora
        console.log('Verificando disponibilidad del médico en fecha:', fecha, 'y hora:', hora);
        const citaExistente = await Cita.findOne({
            where: {
                id_medico: id_medico,
                fecha: fecha,
                hora: hora
            },
            transaction: t
        });

        if (citaExistente) {
            console.log('Cita existente encontrada con ID:', citaExistente.id);
            await t.rollback();
            console.log('Transacción cancelada: horario ocupado');
            return res.status(400).json({ mensaje: 'El médico ya tiene una cita programada en ese horario' });
        }
        console.log('Verificación de disponibilidad: OK');

        // Crear la cita
        console.log('Creando nueva cita con datos:', {
            id_paciente: paciente.id,
            id_medico,
            fecha,
            hora
        });
        const nuevaCita = await Cita.create({
            id_paciente: paciente.id,
            id_medico: id_medico,
            fecha: fecha,
            hora: hora,
            estado: 'en espera'
        }, { transaction: t });
        console.log('Cita creada correctamente con ID:', nuevaCita.id);

        await t.commit();
        console.log('Transacción confirmada: cita creada exitosamente');
        console.log('=== FIN: Creación de cita exitosa ===');
        res.status(201).json({
            mensaje: 'Cita creada correctamente',
            cita: nuevaCita
        });

    } catch (error) {
        if (t) await t.rollback();
        console.error('=== ERROR: Creación de cita fallida ===');
        console.error('Error al crear cita:', error);
        console.error('Mensaje de error:', error.message);
        console.error('Stack de error:', error.stack);
        
        // Verificar si es un error de validación de Sequelize
        if (error.name === 'SequelizeValidationError') {
            console.error('Error de validación de Sequelize:', error.errors.map(e => e.message));
            return res.status(400).json({ 
                mensaje: 'Error de validación', 
                errores: error.errors.map(e => e.message) 
            });
        }
        
        // Verificar si es un error de base de datos
        if (error.name === 'SequelizeDatabaseError') {
            console.error('Error de base de datos:', error.parent?.sqlMessage || error.message);
        }
        
        res.status(500).json({ 
            mensaje: 'Error al crear la cita', 
            error: error.message 
        });
    }
};

module.exports = {
    buscarPaciente,
    obtenerPaciente,
    actualizarPaciente,
    registrarPaciente,
    crearCita
};