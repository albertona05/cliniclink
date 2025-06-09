const { Cita, Factura, Medico, Usuario, Paciente, RecetaMedica, Prueba } = require('../models');
const xss = require('xss');
const path = require('path');
const fs = require('fs');
const ftpService = require('../services/ftpService');

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

// Obtener paciente por id_usuario
const obtenerPacientePorUsuario = async (req, res) => {
    try {
        const { id } = req.params; 
        
        // Buscar el paciente por id_usuario
        console.log(`Buscando paciente con id_usuario ${id}`);
        const paciente = await Paciente.findOne({
            where: { id_usuario: id }
        });

        if (!paciente) {
            console.log(`No se encontró paciente con id_usuario ${id}`);
            return res.status(404).json({
                success: false,
                mensaje: 'No se encontró el paciente'
            });
        }

        console.log(`Paciente encontrado con id ${paciente.id}`);
        
        res.json({
            success: true,
            id: paciente.id
        });
    } catch (error) {
        console.error('Error al obtener paciente por id_usuario:', error);
        res.status(500).json({ 
            success: false,
            mensaje: 'Error al obtener paciente'
        });
    }
};

// Obtener citas de un paciente
const obtenerCitasPaciente = async (req, res) => {
    try {
        const { id } = req.params; // Este id es el id_usuario, no el id_paciente
        const usuarioAutenticado = req.usuario;
        
        if (usuarioAutenticado.rol === 'paciente' && usuarioAutenticado.id !== parseInt(id)) {
            console.log('Intento de acceso no autorizado: Usuario', usuarioAutenticado.id, 'intentó acceder a citas del paciente con id_usuario', id);
            return res.status(403).json({ 
                success: false,
                mensaje: 'No tiene permiso para ver las citas de este paciente' 
            });
        }

        // Primero buscar el paciente por id_usuario
        console.log(`Buscando paciente con id_usuario ${id}`);
        const paciente = await Paciente.findOne({
            where: { id_usuario: id }
        });

        if (!paciente) {
            console.log(`No se encontró paciente con id_usuario ${id}`);
            return res.status(404).json({
                success: false,
                mensaje: 'No se encontró el paciente'
            });
        }

        console.log(`Paciente encontrado con id ${paciente.id}, buscando sus citas`);

        // Ahora buscar las citas usando el id del paciente
        const citas = await Cita.findAll({
            where: { id_paciente: paciente.id },
            include: [{
                model: Medico,
                as: 'medico',
                attributes: ['especialidad']
            }],
            attributes: ['id', 'fecha', 'hora', 'estado']
        });

        console.log(`Citas encontradas para el paciente ${paciente.id}:`, citas.length);
        
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
        const usuarioAutenticado = req.usuario;
        
        if (usuarioAutenticado.rol === 'paciente' && usuarioAutenticado.id !== parseInt(id)) {
            console.log('Intento de acceso no autorizado: Usuario', usuarioAutenticado.id, 'intentó acceder a facturas del paciente con id_usuario', id);
            return res.status(403).json({ 
                success: false,
                mensaje: 'No tiene permiso para ver las facturas de este paciente' 
            });
        }

        // Primero buscar el paciente por id_usuario
        console.log(`Buscando paciente con id_usuario ${id}`);
        const paciente = await Paciente.findOne({
            where: { id_usuario: id }
        });

        if (!paciente) {
            console.log(`No se encontró paciente con id_usuario ${id}`);
            return res.status(404).json({
                success: false,
                mensaje: 'No se encontró el paciente'
            });
        }

        console.log(`Paciente encontrado con id ${paciente.id}, buscando sus facturas`);

        // Ahora buscar las facturas usando el id del paciente
        const facturas = await Factura.findAll({
            where: { id_paciente: paciente.id },
            attributes: ['id', 'fecha', 'monto', 'estado']
        });

        console.log(`Facturas encontradas para el paciente ${paciente.id}:`, facturas.length);
        
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

        // Obtener información del paciente y médico para el correo
        console.log('Buscando información del paciente:', id_paciente);
        const paciente = await Paciente.findByPk(id_paciente, {
            include: [{ model: Usuario, as: 'usuario' }]
        });
        console.log('Información del paciente encontrada:', {
            id: paciente?.id,
            tiene_usuario: !!paciente?.usuario,
            email: paciente?.usuario?.email
        });

        console.log('Buscando información del médico:', id_medico);
        const medico = await Medico.findByPk(id_medico, {
            include: [{ model: Usuario, as: 'usuario' }]
        });
        console.log('Información del médico encontrada:', {
            id: medico?.id,
            tiene_usuario: !!medico?.usuario,
            nombre: medico?.usuario?.nombre,
            especialidad: medico?.especialidad
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

const obtenerHistorialPaciente = async (req, res) => {
    try {
        const parametro = req.params.id;
        let paciente;

        // Verificar si el parámetro es un DNI (contiene letras) o un id_usuario (solo números)
        const esDNI = /[A-Za-z]/.test(parametro);
        
        if (esDNI) {
            // Si es un DNI, buscar el paciente por DNI
            console.log(`Buscando paciente con DNI ${parametro}`);
            paciente = await Paciente.findOne({
                where: { dni: parametro }
            });
        } else {
            // Si es un id_usuario, buscar el paciente por id_usuario
            console.log(`Buscando paciente con id_usuario ${parametro}`);
            paciente = await Paciente.findOne({
                where: { id_usuario: parametro }
            });
        }

        if (!paciente) {
            console.log(`No se encontró paciente con ${esDNI ? 'DNI' : 'id_usuario'} ${parametro}`);
            return res.status(404).json({
                success: false,
                mensaje: 'No se encontró el paciente'
            });
        }

        const id_paciente = paciente.id;
        console.log(`Paciente encontrado con id ${id_paciente}`);
        
        if (!id_paciente) {
            return res.status(400).json({
                success: false,
                mensaje: 'ID del paciente es requerido'
            });
        }

        // Obtener citas finalizadas
        const historialCitas = await Cita.findAll({
            where: { 
                id_paciente,
                estado: 'finalizado', // Solo citas finalizadas
                es_prueba: false // Excluir citas que son pruebas médicas
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
            attributes: ['id', 'fecha', 'hora', 'info', 'es_prueba'],
            order: [['fecha', 'DESC'], ['hora', 'DESC']]
        });

        // Obtener citas de pruebas finalizadas
        const historialPruebas = await Cita.findAll({
            where: { 
                id_paciente,
                estado: 'finalizado',
                es_prueba: true // Solo citas que son pruebas médicas
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
            }, {
                model: Prueba,
                as: 'prueba',
                attributes: ['tipo_prueba', 'resultado', 'fecha_realizacion']
            }],
            attributes: ['id', 'fecha', 'hora', 'info', 'es_prueba', 'tipo_prueba'],
            order: [['fecha', 'DESC'], ['hora', 'DESC']]
        });

        // Formatear citas regulares
        const citasFormateadas = historialCitas.map(cita => ({
            id: cita.id,
            fecha: cita.fecha,
            hora: cita.hora,
            especialidad: cita.medico?.especialidad || 'No especificada',
            medico: cita.medico?.usuario?.nombre || 'No especificado',
            info: cita.info || 'Sin información adicional',
            tipo: 'consulta'
        }));

        // Formatear citas de pruebas
        const pruebasFormateadas = historialPruebas.map(cita => ({
            id: cita.id,
            fecha: cita.fecha,
            hora: cita.hora,
            especialidad: cita.medico?.especialidad || 'No especificada',
            medico: cita.medico?.usuario?.nombre || 'No especificado',
            info: cita.prueba?.resultado || cita.info || 'Sin información adicional',
            tipo: 'prueba',
            tipo_prueba: cita.tipo_prueba || cita.prueba?.tipo_prueba || 'No especificado'
        }));

        // Combinar ambos historiales
        const historialCompleto = [...citasFormateadas, ...pruebasFormateadas];
        
        // Ordenar por fecha y hora (de más reciente a más antiguo)
        historialCompleto.sort((a, b) => {
            const fechaA = new Date(a.fecha + 'T' + a.hora);
            const fechaB = new Date(b.fecha + 'T' + b.hora);
            return fechaB.getTime() - fechaA.getTime();
        });

        res.status(200).json({
            success: true,
            data: historialCompleto
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

// Descargar receta médica de un paciente
const descargarReceta = async (req, res) => {
    try {
        const idCita = req.params.id;
        const usuarioId = req.usuario.id;
        const rol = req.usuario.rol;
        
        // Buscar la receta en la base de datos
        const receta = await RecetaMedica.findOne({
            where: { id_cita: idCita }
        });
        
        if (!receta) {
            return res.status(404).json({
                success: false,
                mensaje: 'Receta médica no encontrada'
            });
        }
        
        // Verificar permisos: solo el paciente dueño de la receta o personal médico/admin puede descargar
        if (rol === 'paciente') {
            const paciente = await Paciente.findOne({ where: { id_usuario: usuarioId } });
            
            if (!paciente || paciente.id !== receta.id_paciente) {
                return res.status(403).json({ mensaje: 'No tiene permiso para descargar esta receta' });
            }
        } else if (!['medico', 'admin', 'recepcion'].includes(rol)) {
            return res.status(403).json({ mensaje: 'No tiene permiso para descargar recetas médicas' });
        }
        
        // Verificar que la receta tenga una ruta de archivo
        if (!receta.ruta) {
            return res.status(404).json({ mensaje: 'El archivo de la receta no está disponible' });
        }
        
        // Obtener el nombre del archivo de la ruta
        const nombreArchivo = receta.ruta.split('/').pop();
        
        // Crear un directorio temporal para la descarga
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        
        const tempFilePath = path.join(tempDir, nombreArchivo);
        
        try {
            // Descargar el archivo desde el servidor FTP
            await ftpService.downloadFile(receta.ruta, tempFilePath, 'recetas');
             
            // Configurar los encabezados para la descarga automática
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=receta_${receta.id_paciente}_${receta.id}.pdf`);
            
            // Crear un stream de lectura y enviarlo como respuesta
            const fileStream = fs.createReadStream(tempFilePath);
            fileStream.pipe(res);
            
            // Manejar eventos del stream
            fileStream.on('end', () => {
                // Eliminar el archivo temporal después de enviarlo
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }
            });
            
            fileStream.on('error', (err) => {
                console.error('Error al enviar el archivo:', err);
                if (!res.headersSent) {
                    return res.status(500).json({ mensaje: 'Error al descargar la receta' });
                }
            });
        } catch (error) {
            console.error('Error al descargar el archivo del FTP:', error);
            return res.status(500).json({ mensaje: 'Error al obtener el archivo de la receta' });
        }
    } catch (error) {
        console.error('Error en descargarReceta:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

// Descargar factura de un paciente
const descargarFactura = async (req, res) => {
    const idFactura = req.params.id;
    const usuarioId = req.usuario.id;
    const rol = req.usuario.rol;
    try {
        
            
            
            // Buscar la factura en la base de datos
            const factura = await Factura.findByPk(idFactura);
            
            if (!factura) {
                return res.status(404).json({
                    success: false,
                    mensaje: 'Factura no encontrada'
                });
            }
        
        // Verificar permisos: solo el paciente dueño de la factura o personal médico/admin puede descargar
        if (rol === 'paciente') {
            const paciente = await Paciente.findOne({ where: { id_usuario: usuarioId } });
            
            if (!paciente || paciente.id !== factura.id_paciente) {
                return res.status(403).json({ mensaje: 'No tiene permiso para descargar esta factura' });
            }
        } else if (!['medico', 'admin', 'recepcion'].includes(rol)) {
            return res.status(403).json({ mensaje: 'No tiene permiso para descargar facturas' });
        }
        
        // Verificar que la factura tenga una ruta de archivo
        if (!factura.ruta) {
            return res.status(404).json({ mensaje: 'El archivo de la factura no está disponible' });
        }
        
        // Obtener el nombre del archivo de la ruta
        const nombreArchivo = factura.ruta.split('/').pop();
        
        // Crear un directorio temporal para la descarga
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        
        const tempFilePath = path.join(tempDir, nombreArchivo);
        
        try {
            // Descargar el archivo desde el servidor FTP
            await ftpService.downloadFacturaFile(factura.ruta, tempFilePath);
            
            // Enviar el archivo como respuesta
            res.download(tempFilePath, `factura_${factura.id_paciente}_${factura.id}.pdf`, (err) => {
                // Eliminar el archivo temporal después de enviarlo
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }
                
                if (err && !res.headersSent) {
                    console.error('Error al enviar el archivo:', err);
                    return res.status(500).json({ mensaje: 'Error al descargar la factura' });
                }
            });
        } catch (error) {
            console.error('Error al descargar el archivo del FTP:', error);
            return res.status(500).json({ mensaje: 'Error al obtener el archivo de la factura' });
        }
    } catch (error) {
        console.error('Error en descargarFactura:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};



// Obtener una cita específica por ID
async function obtenerCitaPorId(req, res) {
    try {
        const { id } = req.params;
        
        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                mensaje: 'ID de cita inválido'
            });
        }

        const cita = await Cita.findByPk(id, {
            include: [{
                model: Paciente,
                as: 'paciente',
                attributes: ['id', 'dni'],
                include: [{
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombre']
                }]
            }, {
                model: Medico,
                as: 'medico',
                attributes: ['id', 'especialidad'],
                include: [{
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombre']
                }]
            }]
        });

        if (!cita) {
            return res.status(404).json({
                success: false,
                mensaje: 'Cita no encontrada'
            });
        }

        res.json({
            success: true,
            data: {
                id: cita.id,
                fecha: cita.fecha,
                hora: cita.hora,
                estado: cita.estado,
                info: cita.info,
                es_prueba: cita.es_prueba,
                tipo_prueba: cita.tipo_prueba,
                paciente: {
                    id: cita.paciente?.id,
                    dni: cita.paciente?.dni,
                    id_usuario: cita.paciente?.usuario?.id,
                    nombre: cita.paciente?.usuario?.nombre
                },
                medico: {
                    id: cita.medico?.id,
                    especialidad: cita.medico?.especialidad,
                    id_usuario: cita.medico?.usuario?.id,
                    nombre: cita.medico?.usuario?.nombre
                }
            }
        });
    } catch (error) {
        console.error('Error al obtener cita por ID:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener la cita'
        });
    }
}

module.exports = {
    obtenerCitasPaciente,
    obtenerFacturasPaciente,
    crearCita,
    anularCita,
    obtenerHistorialPaciente,
    descargarReceta,
    descargarFactura,
    obtenerPacientePorUsuario,
    obtenerCitaPorId
};
