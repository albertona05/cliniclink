const db = require('../models');
const { Prueba, Cita, Medico, Paciente, Usuario } = db;
const xss = require('xss');

// Función para sanitizar input
const sanitizarInput = (input) => {
    if (typeof input !== 'string') return input;
    return xss(input.trim());
};

// Crear una nueva prueba médica
async function crearPrueba(req, res) {
    try {
        console.log('Iniciando creación de prueba médica');
        console.log('Datos recibidos:', { ...req.body, usuario: req.usuario?.id });
        
        const { id_prueba, id_medicoAsignado, tipo_prueba, descripcion, fecha_prueba, hora_prueba } = req.body;
        const id_medicoManda = req.usuario.medico?.id;
        
        console.log('ID del médico que solicita:', id_medicoManda);

        // Validar datos requeridos
        console.log('Validando datos requeridos...');
        if (!id_prueba || !id_medicoAsignado || !tipo_prueba) {
            console.log('Error: Datos incompletos', { id_prueba, id_medicoAsignado, tipo_prueba });
            return res.status(400).json({
                success: false,
                mensaje: 'Todos los campos son requeridos'
            });
        }

        // Verificar que el médico que manda existe
        console.log('Verificando perfil del médico solicitante...');
        if (!id_medicoManda) {
            console.log('Error: Médico solicitante no encontrado o sin perfil asociado');
            return res.status(403).json({
                success: false,
                mensaje: 'Acceso denegado. Usuario no es un médico o no tiene un perfil de médico asociado'
            });
        }
        
        // Verificar que el usuario tiene rol de médico
        if (req.usuario.rol !== 'medico') {
            return res.status(403).json({
                success: false,
                mensaje: 'Acceso denegado. Usuario no tiene rol de médico'
            });
        }

        // Verificar que la cita existe
        console.log('Buscando cita:', id_prueba);
        const cita = await Cita.findByPk(id_prueba, {
            include: [{
                model: Paciente,
                as: 'paciente',
                include: [{
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['nombre']
                }]
            }]
        });

        if (!cita) {
            console.log('Error: Cita no encontrada:', id_prueba);
            return res.status(404).json({
                success: false,
                mensaje: 'Cita no encontrada'
            });
        }

        // Verificar que el médico asignado existe
        console.log('Buscando médico asignado:', id_medicoAsignado);
        const medicoAsignado = await Medico.findByPk(id_medicoAsignado, {
            include: [{
                model: Usuario,
                as: 'usuario',
                attributes: ['nombre']
            }]
        });

        if (!medicoAsignado) {
            console.log('Error: Médico asignado no encontrado:', id_medicoAsignado);
            return res.status(404).json({
                success: false,
                mensaje: 'Médico asignado no encontrado'
            });
        }

        // Crear la prueba
        console.log('Creando nueva prueba médica...');
        const nuevaPrueba = await Prueba.create({
            id_medicoManda,
            id_medicoAsignado,
            id_prueba,
            tipo_prueba: sanitizarInput(tipo_prueba),
            descripcion: sanitizarInput(descripcion || ''),
            estado: 'pendiente',
            resultado: '',
            fecha_creacion: new Date(),
            fecha_realizacion: null
        });

        // Crear una cita para el médico asignado
        console.log('Creando nueva cita para la prueba...');
        const nuevaCita = await Cita.create({
            id_paciente: cita.id_paciente,
            id_medico: id_medicoAsignado,
            fecha: sanitizarInput(fecha_prueba), // Fecha seleccionada por el usuario
            hora: sanitizarInput(hora_prueba), // Hora seleccionada por el usuario
            estado: 'espera',
            info: `Prueba: ${tipo_prueba}. ${descripcion || ''}`,
            id_prueba: nuevaPrueba.id, // Referencia a la prueba
            es_prueba: true, // Marcar como prueba médica
            tipo_prueba: tipo_prueba // Tipo de prueba médica
        });

        console.log('Datos de la cita:', { fecha: cita.fecha, hora: cita.hora });
        console.log('Datos de la nueva cita:', { fecha: nuevaCita.fecha, hora: nuevaCita.hora });
        res.status(201).json({
            success: true,
            mensaje: 'Prueba creada exitosamente',
            prueba: nuevaPrueba,
            cita: nuevaCita
        });
    } catch (error) {
        console.error('Error al crear prueba:', error);
        console.error('Stack trace:', error.stack);
        console.error('Detalles adicionales:', {
            requestBody: req.body,
            usuarioId: req.usuario?.id,
            medicoId: req.usuario.medico?.id
        });
        res.status(500).json({
            success: false,
            mensaje: 'Error al crear la prueba'
        });
    }
}

// Obtener todas las pruebas asignadas a un médico
async function obtenerPruebasMedico(req, res) {
    try {
        const id_medico = req.usuario.medico?.id;

        // Verificar que el médico existe
        if (!id_medico) {
            return res.status(403).json({
                success: false,
                mensaje: 'Acceso denegado. Usuario no es un médico'
            });
        }

        // Obtener pruebas donde el médico está asignado
        const pruebas = await Prueba.findAll({
            where: { id_medicoAsignado: id_medico },
            include: [{
                model: Cita,
                as: 'cita',
                include: [{
                    model: Paciente,
                    as: 'paciente',
                    include: [{
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['nombre']
                    }]
                }]
            }, {
                model: Medico,
                as: 'medicoManda',
                include: [{
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['nombre']
                }]
            }]
        });

        const pruebasFormateadas = pruebas.map(prueba => ({
            id: prueba.id,
            tipo_prueba: prueba.tipo_prueba,
            descripcion: prueba.descripcion,
            estado: prueba.estado,
            resultado: prueba.resultado,
            fecha_creacion: prueba.fecha_creacion,
            fecha_realizacion: prueba.fecha_realizacion,
            paciente: prueba.cita?.paciente?.usuario?.nombre || 'No especificado',
            medico_solicitante: prueba.medicoManda?.usuario?.nombre || 'No especificado'
        }));

        res.json({
            success: true,
            data: pruebasFormateadas
        });
    } catch (error) {
        console.error('Error al obtener pruebas:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener las pruebas'
        });
    }
}

// Obtener todas las pruebas solicitadas por un médico
async function obtenerPruebasSolicitadas(req, res) {
    try {
        const id_medico = req.usuario.medico?.id;

        // Verificar que el médico existe
        if (!id_medico) {
            return res.status(403).json({
                success: false,
                mensaje: 'Acceso denegado. Usuario no es un médico'
            });
        }

        // Obtener pruebas solicitadas por el médico
        const pruebas = await Prueba.findAll({
            where: { id_medicoManda: id_medico },
            include: [{
                model: Cita,
                as: 'cita',
                include: [{
                    model: Paciente,
                    as: 'paciente',
                    include: [{
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['nombre']
                    }]
                }]
            }, {
                model: Medico,
                as: 'medicoAsignado',
                include: [{
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['nombre']
                }]
            }]
        });

        const pruebasFormateadas = pruebas.map(prueba => ({
            id: prueba.id,
            tipo_prueba: prueba.tipo_prueba,
            descripcion: prueba.descripcion,
            estado: prueba.estado,
            resultado: prueba.resultado,
            fecha_creacion: prueba.fecha_creacion,
            fecha_realizacion: prueba.fecha_realizacion,
            paciente: prueba.cita?.paciente?.usuario?.nombre || 'No especificado',
            medico_asignado: prueba.medicoAsignado?.usuario?.nombre || 'No especificado'
        }));

        res.json({
            success: true,
            data: pruebasFormateadas
        });
    } catch (error) {
        console.error('Error al obtener pruebas solicitadas:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener las pruebas solicitadas'
        });
    }
}

// Finalizar una prueba y actualizar su resultado
async function finalizarPrueba(req, res) {
    try {
        console.log('Iniciando finalización de prueba médica');
        console.log('Datos recibidos:', { ...req.body, usuario: req.usuario?.id });
        
        const { id_prueba, resultado, archivos } = req.body;
        const id_medico = req.usuario.medico?.id;

        console.log('ID del médico que finaliza:', id_medico);

        // Validar datos requeridos
        console.log('Validando datos requeridos...');
        if (!id_prueba || !resultado) {
            console.log('Error: Datos incompletos', { id_prueba, resultado });
            return res.status(400).json({
                success: false,
                mensaje: 'El ID de la cita y el resultado son requeridos'
            });
        }

        // Verificar que el médico existe
        console.log('Verificando perfil del médico...');
        if (!id_medico) {
            console.log('Error: Médico no encontrado o sin perfil asociado');
            return res.status(403).json({
                success: false,
                mensaje: 'Acceso denegado. Usuario no es un médico'
            });
        }

        let prueba;
        let cita;

        // Buscar la cita para obtener el id_prueba
        console.log('Buscando cita:', id_prueba);
        cita = await Cita.findByPk(id_prueba);

        if (!cita) {
            console.log('Error: Cita no encontrada:', id_prueba);
            return res.status(404).json({
                success: false,
                mensaje: 'Cita no encontrada'
            });
        }

        // Verificar que la cita tiene una prueba asociada
        if (!cita.id_prueba) {
            console.log('Error: La cita no tiene una prueba asociada');
            return res.status(404).json({
                success: false,
                mensaje: 'La cita no tiene una prueba médica asociada'
            });
        }

        // Buscar la prueba usando el id_prueba de la cita
        console.log('Buscando prueba con ID:', cita.id_prueba);
        prueba = await Prueba.findByPk(cita.id_prueba);
        
        if (!prueba) {
            console.log('Error: Prueba no encontrada:', cita.id_prueba);
            return res.status(404).json({
                success: false,
                mensaje: 'Prueba no encontrada'
            });
        }

        // Verificar que el médico es el asignado a la prueba
        if (prueba.id_medicoAsignado !== id_medico) {
            console.log('Error: Médico no autorizado. Médico asignado:', prueba.id_medicoAsignado, 'Médico solicitante:', id_medico);
            return res.status(403).json({
                success: false,
                mensaje: 'No tiene permiso para finalizar esta prueba'
            });
        }

        // Preparar datos de archivos si existen
        console.log('Procesando archivos adjuntos...');
        let archivosData = null;
        if (archivos && archivos.length > 0) {
            console.log(`Procesando ${archivos.length} archivos adjuntos`);
            archivosData = JSON.stringify(archivos);
        }

        // Actualizar la prueba
        console.log('Actualizando estado de la prueba a finalizado...');
        await prueba.update({
            estado: 'finalizado',
            resultado: sanitizarInput(resultado),
            archivos_adjuntos: archivosData,
            fecha_realizacion: new Date()
        });

        // Actualizar el estado de la cita si existe
        if (cita) {
            console.log('Actualizando estado de la cita asociada...');
            await cita.update({
                estado: 'finalizado',
                info: `${cita.info || ''}\nResultado: ${resultado}`
            });
        } else {
            console.log('No hay cita asociada a esta prueba');
        }

        console.log('Prueba finalizada exitosamente');
        const respuesta = {
            success: true,
            mensaje: 'Prueba finalizada exitosamente',
            prueba
        };
        
        // Incluir la cita en la respuesta solo si existe
        if (cita) {
            respuesta.cita = cita;
        }
        
        res.json(respuesta);
    } catch (error) {
        console.error('Error al finalizar prueba:', error);
        console.error('Detalles adicionales:', {
            requestBody: req.body,
            usuarioId: req.usuario?.id,
            medicoId: req.usuario.medico?.id
        });
        res.status(500).json({
            success: false,
            mensaje: 'Error al finalizar la prueba'
        });
    }
}

module.exports = {
    crearPrueba,
    obtenerPruebasMedico,
    obtenerPruebasSolicitadas,
    finalizarPrueba
};