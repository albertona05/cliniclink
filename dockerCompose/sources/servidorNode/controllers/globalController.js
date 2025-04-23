const Medico = require('../models/medicoModel');
const Usuario = require('../models/usuarioModel');
const Cita = require('../models/citaModel');
const { Op } = require('sequelize');

// Función para obtener todos los médicos
const obtenerMedicos = async (req, res) => {
    try {
        const medicos = await Medico.findAll({
            include: [{
                model: Usuario,
                as: 'usuario',
                attributes: ['nombre']
            }],
            attributes: ['id', 'especialidad']
        });

        // Formatear la respuesta
        const medicosFormateados = medicos.map(medico => ({
            id: medico.id,
            nombre: medico.usuario.nombre,
            especialidad: medico.especialidad
        }));

        res.status(200).json({
            success: true,
            data: medicosFormateados
        });
    } catch (error) {
        console.error('Error al obtener médicos:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener la lista de médicos',
            error: error.message
        });
    }
};

// Función para obtener las horas disponibles de un médico en una fecha específica
const obtenerHorasLibres = async (req, res) => {
    try {
        const { id_medico, fecha } = req.query;

        // Obtener todas las citas del médico para esa fecha
        const citasDelDia = await Cita.findAll({
            where: {
                id_medico,
                fecha
            },
            attributes: ['hora']
        });

        // Crear arrays con los rangos de horas de trabajo incluyendo medias horas
        const generarIntervalos = (inicio, fin) => {
            const intervalos = [];
            for (let hora = inicio; hora < fin; hora++) {
                intervalos.push(`${hora}:00`);
                intervalos.push(`${hora}:30`);
            }
            return intervalos;
        };

        const horasManana = generarIntervalos(8, 13); // 8:00 a 12:30
        const horasTarde = generarIntervalos(17, 20); // 17:00 a 19:30
        const todasLasHoras = [...horasManana, ...horasTarde];

        // Obtener las horas ocupadas
        const horasOcupadas = citasDelDia.map(cita => cita.hora);

        // Filtrar las horas disponibles considerando que cada cita dura 30 minutos
        const horasDisponibles = todasLasHoras.filter(hora => {
            // Verificar que ni la hora actual ni la siguiente media hora estén ocupadas
            return !horasOcupadas.includes(hora);
        });

        res.status(200).json({
            success: true,
            data: {
                fecha,
                horas_disponibles: horasDisponibles
            }
        });

    } catch (error) {
        console.error('Error al obtener horas disponibles:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener las horas disponibles',
            error: error.message
        });
    }
};




module.exports = {
    obtenerMedicos,
    obtenerHorasLibres,
};