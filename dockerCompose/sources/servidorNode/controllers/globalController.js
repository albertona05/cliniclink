const { Medico, Usuario, Cita } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');


//Para ver que funciona muestra Servidor Working
const funciona = async(req, res) => {
    try {
        const contrasenaPlano = 'contrasena_segura123'; 
        const hash = await bcrypt.hash(contrasenaPlano, 10);

        res.status(200).json({
            success: true,
            mensaje: 'Contraseña hasheada con éxito',
            hash: hash
        });
    } catch (error) {
        console.error('Error al hashear la contraseña:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al hashear la contraseña',
            error: error.message
        });
    }
};

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
    const { id_medico, fecha } = req.query;

    try {
        const citasDelDia = await Cita.findAll({
            where: {
                id_medico,
                fecha,
                estado: {
                    [Op.in]: ['espera', 'finalizado']
                }
            },
            attributes: ['hora', 'estado']
        });
    
        console.log('Citas encontradas:', citasDelDia.map(cita => ({ hora: cita.hora, estado: cita.estado })));
    
        const generarIntervalos = (inicio, fin) => {
            const intervalos = [];
            for (let hora = inicio; hora < fin; hora++) {
                intervalos.push(`${hora.toString().padStart(2, '0')}:00`);
                intervalos.push(`${hora.toString().padStart(2, '0')}:30`);
            }
            return intervalos;
        };
    
        const horasManana = generarIntervalos(8, 13); // 8:00 a 12:30
        const horasTarde = generarIntervalos(17, 20); // 17:00 a 19:30
        const todasLasHoras = [...horasManana, ...horasTarde];
    
        // Obtener las horas ocupadas (normalizadas por si acaso)
        const horasOcupadas = citasDelDia.map(cita => {
            const [hora, minutos] = cita.hora.split(':');
            return `${hora.padStart(2, '0')}:${minutos.padStart(2, '0')}`;
        });
    
        console.log('Horas ocupadas:', horasOcupadas);
    
        // Filtrar solo las horas que no están ocupadas
        const horasDisponibles = todasLasHoras.filter(hora => !horasOcupadas.includes(hora));
    
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
    funciona,
};