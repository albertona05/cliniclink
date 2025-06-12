const { Usuario, Paciente, Cita, Factura, Medico } = require('../models');
const { Op, where } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { enviarConfirmacionCita } = require('../config/emailConfig');
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

        // Generar contraseña automática: dos primeras letras del nombre + día + año de nacimiento
        try {
            // Dividir el nombre completo en partes
            const nombrePartes = nombre.split(' ');
            let contrasena = '';
            
            // Obtener las dos primeras letras del nombre
            if (nombrePartes.length > 0) {
                // Si el nombre tiene al menos 2 caracteres, tomar los 2 primeros
                if (nombrePartes[0].length >= 2) {
                    contrasena += nombrePartes[0].substring(0, 2).toLowerCase();
                } 
                // Si el nombre tiene solo 1 carácter, tomar ese y añadir la primera letra del siguiente nombre/apellido si existe
                else if (nombrePartes[0].length === 1) {
                    contrasena += nombrePartes[0].charAt(0).toLowerCase();
                    if (nombrePartes.length > 1) {
                        contrasena += nombrePartes[1].charAt(0).toLowerCase();
                    } else {
                        // Si no hay más partes del nombre, duplicar la única letra
                        contrasena += nombrePartes[0].charAt(0).toLowerCase();
                    }
                }
            }
            
            // Obtener día y año de nacimiento
            const fechaNac = new Date(fechaNacimiento);
            const diaNacimiento = fechaNac.getDate().toString().padStart(2, '0'); // Asegurar 2 dígitos
            const anioNacimiento = fechaNac.getFullYear();
            contrasena += diaNacimiento + anioNacimiento;
            
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
    let t;
    try {
        t = await sequelize.transaction();
        const { fecha, hora, id_medico, dni_paciente } = req.body;
        console.log('Datos recibidos:', { fecha, hora, id_medico, dni_paciente });
        
        // Sanitizar y validar datos
        const fechaSanitizada = sanitizarInput(fecha);
        const horaSanitizada = sanitizarInput(hora);
        const idMedicoSanitizado = id_medico ? Number(id_medico) : null;
        const dniPacienteSanitizado = sanitizarInput(dni_paciente);

        // Validar datos requeridos
        if (!fechaSanitizada || !horaSanitizada || !idMedicoSanitizado || !dniPacienteSanitizado) {
            await t.rollback();
            return res.status(400).json({ 
                success: false,
                mensaje: 'Todos los campos son obligatorios' 
            });
        }

        // Validar formato de DNI
        if (!/^\d{8}[A-Za-z]$/.test(dniPacienteSanitizado)) {
            await t.rollback();
            return res.status(400).json({ 
                success: false,
                mensaje: 'El formato del DNI no es válido. Debe contener 8 dígitos seguidos de una letra' 
            });
        }

        // Buscar paciente y médico
        const [paciente, medico] = await Promise.all([
            Paciente.findOne({ where: { dni: dniPacienteSanitizado }, transaction: t }),
            Medico.findByPk(idMedicoSanitizado, { transaction: t })
        ]);

        // Buscar Usuario -> paciente y médico
        const [uPaciente, uMedico] = await Promise.all([
            Usuario.findOne({ where: { id: paciente.id_usuario }, transaction: t }),
            Usuario.findOne({ where: { id: medico.id_usuario }, transaction: t })
        ]);

        if (!paciente || !medico) {
            await t.rollback();
            return res.status(404).json({ 
                success: false,
                mensaje: !paciente ? 'Paciente no encontrado' : 'Médico no encontrado'
            });
        }

        // Verificar disponibilidad
        const citaExistente = await Cita.findOne({
            where: {
                id_medico: idMedicoSanitizado,
                fecha: fechaSanitizada,
                hora: horaSanitizada
            },
            transaction: t
        });

        if (citaExistente) {
            await t.rollback();
            return res.status(400).json({ 
                success: false,
                mensaje: 'El médico ya tiene una cita programada en ese horario' 
            });
        }

        // Crear la cita
        const nuevaCita = await Cita.create({
            id_paciente: paciente.id,
            id_medico: idMedicoSanitizado,
            fecha: fechaSanitizada,
            hora: horaSanitizada,
            estado: 'espera'
        }, { transaction: t });

        console.log(uMedico)
         // Enviar correo de confirmación
         if (uPaciente?.email) {
            console.log('Intentando enviar correo de confirmación');
            const emailEnviado = await enviarConfirmacionCita(uPaciente?.email, {
                fecha,
                hora,
                medico: uMedico?.nombre || 'No especificado',
                especialidad: medico?.especialidad || 'No especificada'
            });
            console.log('Resultado del envío de correo:', emailEnviado);
        } else {
            console.log('No se pudo enviar el correo: email del paciente no disponible');
        }
        
        await t.commit();
        res.status(201).json({
            success: true,
            mensaje: 'Cita creada correctamente',
            cita: nuevaCita
        });

    } catch (error) {
        if (t) await t.rollback();
        console.error('Error al crear cita:', error);
        
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ 
                success: false,
                mensaje: 'Error de validación', 
                errores: error.errors.map(e => e.message) 
            });
        }
        
        res.status(500).json({ 
            success: false,
            mensaje: 'Error al crear la cita', 
            error: error.message 
        });
    }
};

// Registrar nuevo médico
const registrarMedico = async (req, res) => {
    let t;
    try {
        t = await sequelize.transaction();
        
        let { nombre, email, especialidad, contrasena } = req.body;

        // Validar y sanitizar inputs
        nombre = sanitizarInput(nombre);
        email = sanitizarInput(email);
        especialidad = sanitizarInput(especialidad);

        // Validacion campos vacios
        if (!nombre || !email || !especialidad || !contrasena) {
            await t.rollback();
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
        }

        // Verificar email duplicado
        const emailExistente = await Usuario.findOne({ where: { email }, transaction: t });
        if (emailExistente) {
            await t.rollback();
            return res.status(400).json({ mensaje: 'El email ya está registrado' });
        }

        // Validar longitud de contraseña
        if (contrasena.length < 8) {
            await t.rollback();
            return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres' });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contrasena, salt);
        
        // Crear usuario
        const usuario = await Usuario.create({
            nombre,
            email,
            contrasena: hashedPassword,
            rol: 'medico'
        }, { transaction: t });

        // Crear médico
        const medicoCreado = await Medico.create({
            id_usuario: usuario.id,
            especialidad
        }, { transaction: t });

        await t.commit();
        res.status(201).json({ 
            mensaje: 'Médico registrado correctamente'
        });
    } catch (error) {
        if (t) await t.rollback();
        console.error('=== ERROR: Registro de médico fallido ===');
        console.error('Error al registrar médico:', error);
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
            mensaje: 'Error al registrar médico', 
            error: error.message 
        });
    }
};

module.exports = {
    buscarPaciente,
    obtenerPaciente,
    actualizarPaciente,
    registrarPaciente,
    registrarMedico,
    crearCita
};