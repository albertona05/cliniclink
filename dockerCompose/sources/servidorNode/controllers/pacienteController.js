const { Cita, Factura, Medico, Usuario } = require('../models');
const xss = require('xss');

// Función para sanitizar input
const sanitizarInput = (input) => {
    if (typeof input !== 'string') return input;
    return xss(input.trim());
};

// Validación de fecha
const validarFecha = (fecha) => {
    const fechaObj = new Date(fecha);
    const hoy = new Date();
    return fechaObj >= hoy;
};

// Obtener citas de un paciente
const obtenerCitasPaciente = async (req, res) => {
    try {
        const { id } = req.params;

        const citas = await Cita.findAll({
            where: { id_paciente: id },
            include: [{
                model: Medico,
                as: 'medico',
                attributes: ['especialidad']
            }],
            attributes: ['id', 'fecha', 'hora', 'estado']
        });

        res.json(citas.map(cita => ({
            id: cita.id,
            fecha: cita.fecha,
            hora: cita.hora,
            estado: cita.estado,
            especialidad: cita.medico.especialidad
        })));
    } catch (error) {
        console.error('Error al obtener citas:', error);
        res.status(500).json({ 
            success: false,
            mensaje: 'Error al obtener citas'
        });
    }
};

// Obtener facturas de un paciente
const obtenerFacturasPaciente = async (req, res) => {
    try {
        const { id } = req.params;

        const facturas = await Factura.findAll({
            where: { id_paciente: id },
            attributes: ['id', 'fecha', 'monto', 'estado']
        });

        res.json(facturas);
    } catch (error) {
        console.error('Error al obtener facturas:', error);
        res.status(500).json({ 
            success: false,
            mensaje: 'Error al obtener facturas'
        });
    }
};

// Crear una cita
const crearCita = async (req, res) => {
    try {
        const id_paciente = parseInt(req.body.id_paciente);
        const id_medico = parseInt(req.body.id_medico);
        const fecha = sanitizarInput(req.body.fecha);
        const hora = sanitizarInput(req.body.hora);

        // Validar datos requeridos
        if (!id_paciente || !id_medico || !fecha || !hora) {
            return res.status(400).json({
                success: false,
                mensaje: 'Todos los campos son requeridos'
            });
        }

        // Validar IDs
        if (isNaN(id_paciente) || isNaN(id_medico)) {
            return res.status(400).json({
                success: false,
                mensaje: 'IDs inválidos'
            });
        }

        // Validar fecha futura
        if (!validarFecha(fecha)) {
            return res.status(400).json({
                success: false,
                mensaje: 'La fecha debe ser futura'
            });
        }

        // Validar que la hora esté dentro del horario de trabajo y sea en punto o media hora
        const [horaStr, minutoStr] = hora.split(':');
        const horaNum = parseInt(horaStr);
        const minutoNum = parseInt(minutoStr);

        if (!((horaNum >= 8 && horaNum < 13) || (horaNum >= 17 && horaNum < 20))) {
            return res.status(400).json({
                success: false,
                mensaje: 'La hora debe estar entre 8:00-13:00 o 17:00-20:00'
            });
        }

        // Validar que la cita sea en punto o y media 
        if (minutoNum !== 0 && minutoNum !== 30) {
            return res.status(400).json({
                success: false,
                mensaje: 'Las citas solo pueden comenzar en punto o media hora'
            });
        }

        // Verificar si ya existe una cita para ese médico en esa fecha y hora
        const citaExistente = await Cita.findOne({
            where: {
                id_medico,
                fecha,
                hora
            }
        });

        if (citaExistente) {
            return res.status(400).json({
                success: false,
                mensaje: 'Ya existe una cita para este médico en esta fecha y hora'
            });
        }

        // Crear la cita
        const nuevaCita = await Cita.create({
            id_paciente,
            id_medico,
            fecha,
            hora,
            estado: 'en espera'
        });

        res.status(201).json({
            success: true,
            mensaje: 'Cita creada exitosamente',
            data: nuevaCita
        });
    } catch (error) {
        console.error('Error al crear cita:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al crear la cita',
            error: error.message
        });
    }
};

// Función para obtener el historial de citas de un paciente
const obtenerHistorialPaciente = async (req, res) => {
    try {
        const id_paciente = req.params.id;
        
        if (!id_paciente) {
            return res.status(400).json({
                success: false,
                mensaje: 'ID del paciente es requerido'
            });
        }

        const historialCitas = await Cita.findAll({
            where: { 
                id_paciente,
                estado: 'finalizado' // Solo citas finalizadas
            },
            include: [{
                model: Medico,
                as: 'medico',
                attributes: ['especialidad'],
                include: [{
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['nombre']
                }]
            }],
            attributes: ['id', 'fecha', 'hora', 'info'],
            order: [['fecha', 'DESC'], ['hora', 'DESC']]
        });

        const citasFormateadas = historialCitas.map(cita => ({
            id: cita.id,
            fecha: cita.fecha,
            hora: cita.hora,
            especialidad: cita.medico?.especialidad || 'No especificada',
            medico: cita.medico?.usuario?.nombre || 'No especificado',
            info: cita.info || 'Sin información adicional'
        }));

        res.status(200).json({
            success: true,
            data: citasFormateadas
        });
    } catch (error) {
        console.error('Error al obtener historial de citas:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener el historial de citas',
            error: error.message
        });
    }
};

// Anular una cita
async function anularCita(req, res) {
    try {
        const id_cita = parseInt(req.params.id);

        // Validar ID de la cita
        if (!id_cita || isNaN(id_cita)) {
            return res.status(400).json({
                success: false,
                mensaje: 'ID de cita inválido'
            });
        }

        const cita = await Cita.findByPk(id_cita);
        if (!cita) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }

        await cita.update({ estado: 'cancelado' });
        res.json({ mensaje: 'Cita anulada exitosamente' });
    } catch (error) {
        console.error('Error al anular cita:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al anular la cita'
        });
    }
}

module.exports = {
    obtenerCitasPaciente,
    obtenerFacturasPaciente,
    crearCita,
    anularCita,
    obtenerHistorialPaciente
};