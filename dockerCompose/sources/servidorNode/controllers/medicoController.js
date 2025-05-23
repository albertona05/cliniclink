const db = require('../models');
const { Cita, Paciente, Medico, RecetaMedica, Factura, Usuario } = db;
const PDFDocument = require('pdfkit');
const fs = require('fs');
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

// Obtener todas las citas de un médico para una fecha específica
async function obtenerCitasDia(req, res) {
    try {
        const fecha = sanitizarInput(req.body.fecha);
        
        // Validar datos requeridos
        if (!fecha) {
            return res.status(400).json({
                success: false,
                mensaje: 'La fecha es requerida'
            });
        }

        // Obtener el médico asociado al usuario autenticado
        const medico = await Medico.findOne({
            where: { id_usuario: req.usuario.id }
        });

        if (!medico) {
            return res.status(403).json({
                success: false,
                mensaje: 'Acceso denegado. Usuario no es un médico'
            });
        }

        const id_medico = medico.id;

        const citas = await Cita.findAll({
            where: {
                fecha: fecha,
                id_medico: id_medico,
                estado: 'espera'
            },
            include: [{
                model: Paciente,
                as: 'paciente',
                include: [{
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['nombre']
                }]
            }],
            attributes: ['id', 'hora', 'es_prueba', 'tipo_prueba', 'info']
        });

        const citasFormateadas = citas.map(cita => ({
            id: cita.id,
            hora: cita.hora,
            nombre_paciente: `${cita.paciente.usuario.nombre}`,
            es_prueba: cita.es_prueba || false,
            tipo_prueba: cita.tipo_prueba || '',
            info: cita.info || ''
        }));

        res.json(citasFormateadas);
    } catch (error) {
        console.error('Error al obtener citas:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener las citas'
        });
    }
}

// Generar PDF de receta médica
async function generarRecetaPDF(datos) {
    return new Promise((resolve, reject) => {
        // Verificar si el directorio existe, si no, crearlo
        const dirPath = './recetas';
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`Directorio creado: ${dirPath}`);
        }
        
        const doc = new PDFDocument();
        const filePath = `${dirPath}/receta_${datos.id_cita}.pdf`;
        const writeStream = fs.createWriteStream(filePath);

        doc.pipe(writeStream);
        doc.fontSize(16).text('RECETA MÉDICA', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Fecha: ${new Date().toLocaleDateString()}`);
        doc.moveDown();
        doc.text(`Doctor: ${datos.nombre_medico}`);
        doc.moveDown();
        doc.text('Medicamentos:');
        doc.moveDown();
        
        // Mostrar cada medicamento con sus instrucciones
        if (datos.medicamentos && Array.isArray(datos.medicamentos)) {
            datos.medicamentos.forEach((med, index) => {
                doc.text(`${index + 1}. ${med.nombre}`);
                doc.text(`   Dosis: ${med.dosis}`);
                doc.text(`   Frecuencia: ${med.frecuencia}`);
                doc.text(`   Duración: ${med.duracion}`);
                if (med.instrucciones) {
                    doc.text(`   Instrucciones: ${med.instrucciones}`);
                }
                doc.moveDown();
            });
        } else {
            doc.text('No se especificaron medicamentos');
        }
        
        doc.moveDown();
        doc.text(`Información adicional: ${datos.info}`);
        doc.end();

        writeStream.on('finish', () => resolve(filePath));
        writeStream.on('error', reject);
    });
}

// Generar PDF de factura
async function generarFacturaPDF(datos) {
    return new Promise((resolve, reject) => {
        // Verificar si el directorio existe, si no, crearlo
        const dirPath = './facturas';
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`Directorio creado: ${dirPath}`);
        }
        
        const doc = new PDFDocument();
        const filePath = `${dirPath}/factura_${datos.id_cita}.pdf`;
        const writeStream = fs.createWriteStream(filePath);

        doc.pipe(writeStream);
        doc.fontSize(16).text('FACTURA', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Fecha: ${new Date().toLocaleDateString()}`);
        doc.moveDown();
        doc.text(`Paciente: ${datos.nombre_paciente}`);
        doc.text(`Doctor: ${datos.nombre_medico}`);
        doc.moveDown();
        doc.text(`Precio de consulta: $${datos.precio_consulta}`);
        doc.end();

        writeStream.on('finish', () => resolve(filePath));
        writeStream.on('error', reject);
    });
}

// Finalizar cita y generar documentos
async function finalizarCita(req, res) {
    try {
        const { info, medicamentos, precio_consulta, id_medico, id_cita, nueva_fecha, nueva_hora } = req.body;

        if (!id_cita) {
            return res.status(400).json({ error: 'ID de la cita es requerido' });
        }

        const cita = await Cita.findByPk(id_cita, {
            include: [{
                model: Paciente,
                as: 'paciente',
                include: [{
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['nombre']
                }]
            }, {
                model: Medico,
                as: 'medico',
                include: [{
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['nombre']
                }]
            }]
        });

        if (!cita) {
            return res.status(404).json({ error: 'Cita no encontrada' });
        }

        // Actualizar información de la cita
        await cita.update({
            info: info,
            estado: 'finalizado'
        });

        const resultados = {
            mensaje: 'Cita finalizada exitosamente',
            receta_path: null,
            factura_path: null
        };

        // Generar receta médica si hay medicamentos
        if (medicamentos && Array.isArray(medicamentos) && medicamentos.length > 0) {
            const datosReceta = {
                id_cita,
                nombre_medico: `${cita.medico.usuario.nombre}`,
                medicamentos,
                info
            };
            resultados.receta_path = await generarRecetaPDF(datosReceta);

            // Guardar receta en la base de datos
            const recetaCreada = await RecetaMedica.create({
                id_cita,
                id_medico: cita.id_medico,
                id_paciente: cita.id_paciente,
                descripcion: 'Ver detalle de medicamentos'
            });
            
            // Guardar cada medicamento asociado a la receta
            for (const med of medicamentos) {
                await db.RecetaMedicamento.create({
                    id_receta: recetaCreada.id,
                    id_medicamento: med.id_medicamento,
                    frecuencia: med.frecuencia,
                    duracion: med.duracion,
                    dosis: med.dosis,
                    instrucciones: med.instrucciones || ''
                });
            }
        }

        // Generar factura si hay precio de consulta
        if (precio_consulta) {
            const datosFactura = {
                id_cita,
                nombre_paciente: `${cita.paciente.usuario.nombre}`,
                nombre_medico: `${cita.medico.usuario.nombre}`,
                precio_consulta
            };
            resultados.factura_path = await generarFacturaPDF(datosFactura);

            // Guardar factura en la base de datos
            await Factura.create({
                id_paciente: cita.id_paciente,
                monto: precio_consulta,
                estado: 'en espera'
            });
        }

        // Si se proporcionan datos para una nueva cita, crearla
        if (id_medico && nueva_fecha && nueva_hora) {
            try {
                const nuevaCitaData = {
                    id_paciente: cita.id_paciente,
                    id_medico,
                    fecha: nueva_fecha,
                    hora: nueva_hora
                };
                
                // Crear una nueva cita utilizando la función del controlador de recepción
                const { crearCita } = require('./recepcionController');
                await crearCita({ body: nuevaCitaData }, {
                    status: (code) => ({
                        json: (data) => {
                            if (code === 201) {
                                resultados.nueva_cita = data.cita;
                                resultados.mensaje_nueva_cita = 'Nueva cita creada exitosamente';
                            } else {
                                resultados.error_nueva_cita = data.mensaje;
                            }
                        }
                    })
                });
            } catch (error) {
                resultados.error_nueva_cita = 'Error al crear la nueva cita';
                console.error('Error al crear nueva cita:', error);
            }
        }

        res.json(resultados);
    } catch (error) {
        console.error('Error al finalizar cita:', error);
        res.status(500).json({ error: 'Error al finalizar la cita' });
    }
}

module.exports = {
    obtenerCitasDia,
    finalizarCita
};