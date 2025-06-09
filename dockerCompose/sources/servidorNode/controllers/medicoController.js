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
            dni_paciente: cita.paciente.dni || '',
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
        
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            bufferPages: true
        });
        const fileName = `receta_${datos.id_paciente}_${datos.id_receta}.pdf`;
        const filePath = `${dirPath}/${fileName}`;
        const writeStream = fs.createWriteStream(filePath);

        // Fecha actual formateada
        const fechaActual = new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Colores
        const colorPrimario = '#009688';
        const colorSecundario = '#333333';
        const colorTexto = '#555555';

        doc.pipe(writeStream);

        // Encabezado
        doc.rect(50, 50, 495, 100)
           .fillAndStroke('#f8f9fa', '#e9ecef');

        // Logo o nombre de la clínica
        doc.fontSize(24)
           .fillColor(colorPrimario)
           .text('ClinicLink', 70, 65, { width: 250 });

        doc.fontSize(10)
           .fillColor(colorSecundario)
           .text('Centro Médico Especializado', 70, 95, { width: 250 });

        doc.fontSize(10)
           .fillColor(colorTexto)
           .text('C/ Principal 123, 28001 Madrid', 70, 110, { width: 250 })
           .text('Tel: +34 91 123 45 67', 70, 125, { width: 250 })
           .text('info@cliniclink.com', 70, 140, { width: 250 });

        // Título del documento
        doc.fontSize(18)
           .fillColor(colorPrimario)
           .text('RECETA MÉDICA', 350, 65, { width: 170, align: 'right' });

        doc.fontSize(10)
           .fillColor(colorSecundario)
           .text(`Fecha: ${fechaActual}`, 350, 95, { width: 170, align: 'right' });

        // Información del médico
        doc.rect(50, 170, 495, 60)
           .fillAndStroke('white', '#e9ecef');

        doc.fontSize(12)
           .fillColor(colorPrimario)
           .text('MÉDICO', 70, 185);

        doc.fontSize(10)
           .fillColor(colorTexto)
           .text(`Dr./Dra.: ${datos.nombre_medico}`, 70, 205);

        // Medicamentos
        doc.rect(50, 250, 495, 30)
           .fillAndStroke(colorPrimario, colorPrimario);

        doc.fontSize(12)
           .fillColor('white')
           .text('MEDICAMENTOS RECETADOS', 70, 260);

        let yPosition = 300;

        // Mostrar cada medicamento con sus instrucciones
        if (datos.medicamentos && Array.isArray(datos.medicamentos)) {
            datos.medicamentos.forEach((med, index) => {
                doc.rect(50, yPosition, 495, 100)
                   .fillAndStroke('#f8f9fa', '#e9ecef');

                doc.fontSize(11)
                   .fillColor(colorPrimario)
                   .text(`${index + 1}. ${med.nombre}`, 70, yPosition + 10);

                doc.fontSize(10)
                   .fillColor(colorTexto)
                   .text(`Dosis: ${med.dosis}`, 90, yPosition + 30)
                   .text(`Frecuencia: ${med.frecuencia}`, 90, yPosition + 45)
                   .text(`Duración: ${med.duracion}`, 90, yPosition + 60);

                if (med.instrucciones) {
                    doc.text(`Instrucciones: ${med.instrucciones}`, 90, yPosition + 75);
                }

                yPosition += 110;
            });
        } else {
            doc.rect(50, yPosition, 495, 40)
               .fillAndStroke('#f8f9fa', '#e9ecef');

            doc.fontSize(10)
               .fillColor(colorTexto)
               .text('No se especificaron medicamentos', 70, yPosition + 15);

            yPosition += 50;
        }

        // Información adicional
        if (datos.info) {
            doc.rect(50, yPosition, 495, 80)
               .fillAndStroke('#f8f9fa', '#e9ecef');

            doc.fontSize(11)
               .fillColor(colorPrimario)
               .text('INFORMACIÓN ADICIONAL', 70, yPosition + 10);

            doc.fontSize(10)
               .fillColor(colorTexto)
               .text(datos.info, 70, yPosition + 30, { width: 455 });

            yPosition += 90;
        }

        // Firma digital o sello
        doc.fontSize(10)
           .fillColor(colorPrimario)
           .text('ClinicLink - Documento generado electrónicamente', 50, 720, { align: 'center', width: 495 });

        doc.end();

        writeStream.on('finish', async () => {
            try {
                // Importar el servicio FTP
                const ftpService = require('../services/ftpService');
                
                // Subir el archivo al FTP en la carpeta recetas
                const uploaded = await ftpService.uploadFile(filePath, fileName, 'recetas');
                
                if (uploaded) {
                    console.log(`Receta subida exitosamente al FTP: ${fileName}`);
                } else {
                    console.error(`Error al subir la receta al FTP: ${fileName}`);
                }
                
                resolve({
                    localPath: filePath,
                    ftpPath: `/recetas/${fileName}`,
                    fileName: fileName
                });
            } catch (err) {
                console.error('Error al subir la receta al FTP:', err);
                resolve({
                    localPath: filePath,
                    error: err.message
                }); // Resolvemos con la ruta local aunque falle la subida al FTP
            }
        });
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
        
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            bufferPages: true // Permite ajustar el contenido dinámicamente
        });
        const fileName = `factura_${datos.id_paciente}_${datos.id_factura}.pdf`;
        const filePath = `${dirPath}/${fileName}`;
        const writeStream = fs.createWriteStream(filePath);

        // Fecha actual formateada
        const fechaActual = new Date().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Número de factura formateado
        const numeroFactura = `F-${datos.id_cita.toString().padStart(6, '0')}`;

        // Colores
        const colorPrimario = '#009688';
        const colorSecundario = '#333333';
        const colorTexto = '#555555';

        doc.pipe(writeStream);

        // Encabezado - Aumentado el tamaño del rectángulo para evitar desbordamiento
        doc.rect(50, 50, 495, 100)
           .fillAndStroke('#f8f9fa', '#e9ecef');

        // Logo o nombre de la clínica
        doc.fontSize(24)
           .fillColor(colorPrimario)
           .text('ClinicLink', 70, 65, { width: 250 });

        doc.fontSize(10)
           .fillColor(colorSecundario)
           .text('Centro Médico Especializado', 70, 95, { width: 250 });

        doc.fontSize(10)
           .fillColor(colorTexto)
           .text('C/ Principal 123, 28001 Madrid', 70, 110, { width: 250 })
           .text('Tel: +34 91 123 45 67', 70, 125, { width: 250 })
           .text('info@cliniclink.com', 70, 140, { width: 250 });

        // Información de factura
        doc.fontSize(14)
           .fillColor(colorPrimario)
           .text('FACTURA', 350, 65, { width: 170, align: 'right' });

        doc.fontSize(10)
           .fillColor(colorSecundario)
           .text(`Nº: ${numeroFactura}`, 350, 85, { width: 170, align: 'right' })
           .text(`Fecha: ${fechaActual}`, 350, 105, { width: 170, align: 'right' });

        // Información del cliente y aumentado tamaño
        doc.rect(50, 170, 495, 100)
           .fillAndStroke('white', '#e9ecef');

        doc.fontSize(12)
           .fillColor(colorPrimario)
           .text('DATOS DEL PACIENTE', 70, 185);

        doc.fontSize(10)
           .fillColor(colorTexto)
           .text(`Nombre: ${datos.nombre_paciente}`, 70, 205)
           .text(`Doctor: ${datos.nombre_medico}`, 70, 225)
           .text(`Nº de Cita: ${datos.id_cita}`, 70, 245);

        // Detalles de facturación
        doc.rect(50, 290, 495, 30)
           .fillAndStroke(colorPrimario, colorPrimario);

        doc.fontSize(10)
           .fillColor('white')
           .text('DESCRIPCIÓN', 70, 300, { width: 280 })
           .text('IMPORTE', 450, 300, { width: 75, align: 'right' });

        // Contenido de la factura
        doc.rect(50, 320, 495, 30)
           .fillAndStroke('#f8f9fa', '#e9ecef');

        doc.fontSize(10)
           .fillColor(colorTexto)
           .text('Consulta médica', 70, 330, { width: 280 })
           .text(`${datos.precio_consulta}€`, 450, 330, { width: 75, align: 'right' });

        // Total
        doc.rect(350, 370, 195, 30)
           .fillAndStroke('#f8f9fa', '#e9ecef');

        doc.fontSize(12)
           .fillColor(colorPrimario)
           .text('TOTAL', 370, 380, { width: 75 })
           .text(`${datos.precio_consulta}€`, 450, 380, { width: 75, align: 'right' });

        
        // Firma digital o sello
        doc.fontSize(10)
           .fillColor(colorPrimario)
           .text('ClinicLink - Documento generado electrónicamente', 50, 720, { align: 'center', width: 495 });

        doc.end();

        writeStream.on('finish', async () => {
            try {
                // Importar el servicio FTP
                const ftpService = require('../services/ftpService');
                
                // Subir el archivo al FTP en la carpeta facturas
                const uploaded = await ftpService.uploadFacturaFile(filePath, fileName);
                
                if (uploaded) {
                    console.log(`Factura subida exitosamente al FTP: ${fileName}`);
                } else {
                    console.error(`Error al subir la factura al FTP: ${fileName}`);
                }
                
                resolve(filePath);
            } catch (err) {
                console.error('Error al subir la factura al FTP:', err);
                resolve(filePath); // Resolvemos con la ruta local aunque falle la subida al FTP
            }
        });
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
            factura_path: null,
            documentos_generados: []
        };

        // Generar receta médica si hay medicamentos
        if (medicamentos && Array.isArray(medicamentos) && medicamentos.length > 0) {
            // Guardar receta en la base de datos primero
            const recetaCreada = await RecetaMedica.create({
                id_cita,
                id_medico: cita.id_medico,
                id_paciente: cita.id_paciente,
                descripcion: 'Ver detalle de medicamentos',
                ruta: '' // Se actualizará después con el nombre correcto
            });
            
            const datosReceta = {
                id_cita,
                id_paciente: cita.id_paciente,
                id_receta: recetaCreada.id,
                nombre_medico: `${cita.medico.usuario.nombre}`,
                medicamentos,
                info
            };
            const recetaResult = await generarRecetaPDF(datosReceta);
            
            // Actualizar el nombre del archivo con el ID de la receta
            const nuevoNombreReceta = `receta_${cita.id_paciente}_${recetaCreada.id}.pdf`;
            const nuevaRutaReceta = `/recetas/${nuevoNombreReceta}`;
            
            // Actualizar la ruta en la base de datos
            await recetaCreada.update({ ruta: nuevaRutaReceta });
            resultados.receta_path = recetaResult.ftpPath;
            
            // Agregar información de la receta a los documentos generados
            resultados.documentos_generados.push({
                tipo: 'receta',
                nombre: recetaResult.fileName,
                url: `/recetas/descargar/${id_cita}`
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
            // Guardar factura en la base de datos primero
            const facturaCreada = await Factura.create({
                id_paciente: cita.id_paciente,
                monto: precio_consulta,
                estado: 'en espera',
                ruta: '' // Se actualizará después con el nombre correcto
            });
            
            const datosFactura = {
                id_cita,
                id_paciente: cita.id_paciente,
                id_factura: facturaCreada.id,
                nombre_paciente: `${cita.paciente.usuario.nombre}`,
                nombre_medico: `${cita.medico.usuario.nombre}`,
                precio_consulta
            };
            const facturaPath = await generarFacturaPDF(datosFactura);
            
            // Actualizar el nombre del archivo con el ID de la factura
            const nuevoNombreFactura = `factura_${cita.id_paciente}_${facturaCreada.id}.pdf`;
            const nuevaRutaFactura = `/facturas/${nuevoNombreFactura}`;
            
            // Actualizar la ruta en la base de datos
            await facturaCreada.update({ ruta: nuevaRutaFactura });
            
            resultados.factura_path = nuevaRutaFactura;
            
            // Agregar información de la factura a los documentos generados
            resultados.documentos_generados.push({
                tipo: 'factura',
                nombre: nuevoNombreFactura,
                url: `/pacientes/facturas/descargar/${facturaCreada.id}`
            });
        }

        // Si se proporcionan datos para una nueva cita, crearla
        if (id_medico && nueva_fecha && nueva_hora) {
            try {
                // Obtener el DNI del paciente
                const paciente = await Paciente.findByPk(cita.id_paciente);
                
                if (!paciente) {
                    resultados.error_nueva_cita = 'No se pudo encontrar el paciente para crear la nueva cita';
                } else {
                    const nuevaCitaData = {
                        fecha: nueva_fecha,
                        hora: nueva_hora,
                        id_medico,
                        dni_paciente: paciente.dni
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
                }
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