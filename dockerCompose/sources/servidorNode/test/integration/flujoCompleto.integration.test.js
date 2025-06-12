const request = require('supertest');
const express = require('express');
const { sequelize, Usuario, Paciente, Medico, Recepcion, Cita, RecetaMedica, Medicamento, RecetaMedicamento, Prueba, Factura } = require('../../models');
const authController = require('../../controllers/authController');
const pacienteController = require('../../controllers/pacienteController');
const citaController = require('../../controllers/citaController');
const recetaController = require('../../controllers/recetaController');
const pruebaController = require('../../controllers/pruebaController');
const facturaController = require('../../controllers/facturaController');
const authMiddleware = require('../../middleware/authMiddleware');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Configurar la aplicación de prueba completa
const app = express();
app.use(express.json());

// Rutas de autenticación
app.post('/login', authController.login);
app.post('/register', authController.register);

// Rutas de pacientes
app.use('/pacientes', authMiddleware.verificarToken);
app.post('/pacientes', pacienteController.crearPaciente);
app.get('/pacientes/:id', pacienteController.obtenerPacientePorId);
app.put('/pacientes/:id', pacienteController.actualizarPaciente);

// Rutas de citas
app.use('/citas', authMiddleware.verificarToken);
app.post('/citas', citaController.crearCita);
app.get('/citas/paciente/:id', citaController.obtenerCitasPorPaciente);
app.put('/citas/:id', citaController.actualizarCita);

// Rutas de recetas
app.use('/recetas', authMiddleware.verificarToken, authMiddleware.verificarRolMedico);
app.post('/recetas', recetaController.crearReceta);
app.get('/recetas/paciente/:id', recetaController.obtenerRecetasPorPaciente);

// Rutas de pruebas médicas
app.use('/pruebas', authMiddleware.verificarToken, authMiddleware.verificarRolMedico);
app.post('/pruebas', pruebaController.crearPrueba);
app.post('/pruebas/finalizar', pruebaController.finalizarPrueba);

// Rutas de facturas
app.use('/facturas', authMiddleware.verificarToken);
app.post('/facturas', facturaController.crearFactura);
app.get('/facturas/paciente/:id', facturaController.obtenerFacturasPorPaciente);
app.put('/facturas/:id/estado', facturaController.actualizarEstadoFactura);

describe('Prueba de Integración Completa - Flujo ClinicLink', () => {
    let testUsuarioPaciente, testUsuarioMedico, testUsuarioRecepcion;
    let testPaciente, testMedico, testRecepcion;
    let authTokenPaciente, authTokenMedico, authTokenRecepcion;
    let testMedicamento1, testMedicamento2;
    let citaId, recetaId, pruebaId, facturaId;

    beforeAll(async () => {
        // Sincronizar la base de datos
        await sequelize.sync({ force: true });

        // Crear usuarios base
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        testUsuarioPaciente = await Usuario.create({
            nombre: 'Elena Martínez',
            email: 'elena.paciente@cliniclink.com',
            contrasena: hashedPassword,
            rol: 'paciente'
        });

        testUsuarioMedico = await Usuario.create({
            nombre: 'Dr. Roberto García',
            email: 'roberto.medico@cliniclink.com',
            contrasena: hashedPassword,
            rol: 'medico'
        });

        testUsuarioRecepcion = await Usuario.create({
            nombre: 'Isabel Recepción',
            email: 'isabel.recepcion@cliniclink.com',
            contrasena: hashedPassword,
            rol: 'recepcion'
        });

        // Crear perfiles específicos
        testPaciente = await Paciente.create({
            id_usuario: testUsuarioPaciente.id,
            dni: '12345678Z',
            telefono: '612345678',
            fechaNacimiento: '1990-05-15',
            direccion: 'Calle Principal 123, Madrid'
        });

        testMedico = await Medico.create({
            id_usuario: testUsuarioMedico.id,
            especialidad: 'Medicina General'
        });

        testRecepcion = await Recepcion.create({
            id_usuario: testUsuarioRecepcion.id,
            turno: 'mañana'
        });

        // Crear medicamentos de prueba
        testMedicamento1 = await Medicamento.create({
            nombre: 'Paracetamol 500mg',
            descripcion: 'Analgésico y antipirético',
            precio: 3.50,
            stock: 100
        });

        testMedicamento2 = await Medicamento.create({
            nombre: 'Ibuprofeno 400mg',
            descripcion: 'Antiinflamatorio no esteroideo',
            precio: 5.75,
            stock: 80
        });

        // Generar tokens de autenticación
        authTokenPaciente = jwt.sign(
            { 
                id: testUsuarioPaciente.id, 
                rol: 'paciente',
                paciente: { id: testPaciente.id }
            },
            process.env.JWT_SECRET || 'test_secret',
            { expiresIn: '2h' }
        );

        authTokenMedico = jwt.sign(
            { 
                id: testUsuarioMedico.id, 
                rol: 'medico',
                medico: { id: testMedico.id }
            },
            process.env.JWT_SECRET || 'test_secret',
            { expiresIn: '2h' }
        );

        authTokenRecepcion = jwt.sign(
            { 
                id: testUsuarioRecepcion.id, 
                rol: 'recepcion',
                recepcion: { id: testRecepcion.id }
            },
            process.env.JWT_SECRET || 'test_secret',
            { expiresIn: '2h' }
        );
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('Flujo Completo: Desde Registro hasta Facturación', () => {
        test('debería completar todo el flujo de atención médica', async () => {
            console.log('\n🏥 === INICIANDO FLUJO COMPLETO DE CLINICLINK ===');
            
            // ========================================
            // PASO 1: AUTENTICACIÓN Y VERIFICACIÓN
            // ========================================
            console.log('\n📋 PASO 1: Verificando autenticación de usuarios');
            
            // Verificar login del paciente
            const loginPaciente = await request(app)
                .post('/login')
                .send({
                    email: 'elena.paciente@cliniclink.com',
                    contrasena: 'password123'
                });
            
            expect(loginPaciente.status).toBe(200);
            expect(loginPaciente.body.success).toBe(true);
            expect(loginPaciente.body.data.usuario.rol).toBe('paciente');
            console.log('   ✓ Paciente autenticado correctamente');

            // Verificar login del médico
            const loginMedico = await request(app)
                .post('/login')
                .send({
                    email: 'roberto.medico@cliniclink.com',
                    contrasena: 'password123'
                });
            
            expect(loginMedico.status).toBe(200);
            expect(loginMedico.body.success).toBe(true);
            expect(loginMedico.body.data.usuario.rol).toBe('medico');
            console.log('   ✓ Médico autenticado correctamente');

            // Verificar login de recepción
            const loginRecepcion = await request(app)
                .post('/login')
                .send({
                    email: 'isabel.recepcion@cliniclink.com',
                    contrasena: 'password123'
                });
            
            expect(loginRecepcion.status).toBe(200);
            expect(loginRecepcion.body.success).toBe(true);
            expect(loginRecepcion.body.data.usuario.rol).toBe('recepcion');
            console.log('   ✓ Personal de recepción autenticado correctamente');

            // ========================================
            // PASO 2: GESTIÓN DE PACIENTE
            // ========================================
            console.log('\n👤 PASO 2: Verificando datos del paciente');
            
            const datosPaciente = await request(app)
                .get(`/pacientes/${testPaciente.id}`)
                .set('Authorization', `Bearer ${authTokenMedico}`);
            
            expect(datosPaciente.status).toBe(200);
            expect(datosPaciente.body.success).toBe(true);
            expect(datosPaciente.body.data.dni).toBe('12345678Z');
            expect(datosPaciente.body.data.usuario.nombre).toBe('Elena Martínez');
            console.log('   ✓ Datos del paciente verificados');
            console.log(`   📝 Paciente: ${datosPaciente.body.data.usuario.nombre}`);
            console.log(`   🆔 DNI: ${datosPaciente.body.data.dni}`);

            // ========================================
            // PASO 3: PROGRAMACIÓN DE CITA
            // ========================================
            console.log('\n📅 PASO 3: Programando cita médica');
            
            const fechaCita = new Date();
            fechaCita.setDate(fechaCita.getDate() + 7); // Cita para la próxima semana
            
            const nuevaCita = await request(app)
                .post('/citas')
                .set('Authorization', `Bearer ${authTokenRecepcion}`)
                .send({
                    id_paciente: testPaciente.id,
                    id_medico: testMedico.id,
                    fecha: fechaCita.toISOString().split('T')[0],
                    hora: '10:30',
                    info: 'Consulta de medicina general - Revisión anual'
                });
            
            expect(nuevaCita.status).toBe(201);
            expect(nuevaCita.body.success).toBe(true);
            citaId = nuevaCita.body.data.id;
            console.log('   ✓ Cita programada exitosamente');
            console.log(`   📅 Fecha: ${nuevaCita.body.data.fecha}`);
            console.log(`   ⏰ Hora: ${nuevaCita.body.data.hora}`);
            console.log(`   🏥 Médico: Dr. Roberto García`);

            // ========================================
            // PASO 4: FINALIZACIÓN DE CITA
            // ========================================
            console.log('\n🩺 PASO 4: Finalizando consulta médica');
            
            const citaFinalizada = await request(app)
                .put(`/citas/${citaId}`)
                .set('Authorization', `Bearer ${authTokenMedico}`)
                .send({
                    estado: 'finalizado',
                    info: 'Consulta completada. Paciente presenta buen estado general. Se receta tratamiento preventivo.'
                });
            
            expect(citaFinalizada.status).toBe(200);
            expect(citaFinalizada.body.success).toBe(true);
            console.log('   ✓ Consulta médica finalizada');
            console.log('   📋 Diagnóstico: Estado general satisfactorio');

            // ========================================
            // PASO 5: PRESCRIPCIÓN DE RECETA MÉDICA
            // ========================================
            console.log('\n💊 PASO 5: Prescribiendo medicamentos');
            
            const nuevaReceta = await request(app)
                .post('/recetas')
                .set('Authorization', `Bearer ${authTokenMedico}`)
                .send({
                    id_cita: citaId,
                    observaciones: 'Tratamiento preventivo. Tomar con las comidas. Completar todo el tratamiento.',
                    medicamentos: [
                        {
                            id_medicamento: testMedicamento1.id,
                            cantidad: 2,
                            posologia: 'Tomar 1 comprimido cada 8 horas durante 5 días'
                        },
                        {
                            id_medicamento: testMedicamento2.id,
                            cantidad: 1,
                            posologia: 'Tomar 1 comprimido cada 12 horas solo si hay molestias'
                        }
                    ]
                });
            
            expect(nuevaReceta.status).toBe(201);
            expect(nuevaReceta.body.success).toBe(true);
            recetaId = nuevaReceta.body.data.id;
            console.log('   ✓ Receta médica prescrita');
            console.log('   💊 Medicamentos:');
            console.log('     - Paracetamol 500mg (2 cajas)');
            console.log('     - Ibuprofeno 400mg (1 caja)');

            // ========================================
            // PASO 6: SOLICITUD DE PRUEBA MÉDICA
            // ========================================
            console.log('\n🔬 PASO 6: Solicitando prueba médica');
            
            const nuevaPrueba = await request(app)
                .post('/pruebas')
                .set('Authorization', `Bearer ${authTokenMedico}`)
                .send({
                    id_cita: citaId,
                    tipo_prueba: 'Análisis de sangre completo',
                    descripcion: 'Hemograma, bioquímica y perfil lipídico para control anual'
                });
            
            expect(nuevaPrueba.status).toBe(201);
            expect(nuevaPrueba.body.success).toBe(true);
            pruebaId = nuevaPrueba.body.data.id;
            console.log('   ✓ Prueba médica solicitada');
            console.log('   🔬 Tipo: Análisis de sangre completo');
            console.log('   📋 Estado: Pendiente');

            // ========================================
            // PASO 7: FINALIZACIÓN DE PRUEBA MÉDICA
            // ========================================
            console.log('\n📊 PASO 7: Procesando resultados de prueba');
            
            const pruebaFinalizada = await request(app)
                .post('/pruebas/finalizar')
                .set('Authorization', `Bearer ${authTokenMedico}`)
                .send({
                    id_prueba: pruebaId,
                    resultado: 'Análisis de sangre: Todos los parámetros dentro de los valores normales. Hemoglobina: 14.2 g/dL, Glucosa: 95 mg/dL, Colesterol total: 180 mg/dL. No se observan alteraciones significativas.'
                });
            
            expect(pruebaFinalizada.status).toBe(200);
            expect(pruebaFinalizada.body.success).toBe(true);
            console.log('   ✓ Resultados de prueba procesados');
            console.log('   📊 Resultado: Valores normales');

            // ========================================
            // PASO 8: GENERACIÓN DE FACTURA
            // ========================================
            console.log('\n💰 PASO 8: Generando factura');
            
            const nuevaFactura = await request(app)
                .post('/facturas')
                .set('Authorization', `Bearer ${authTokenRecepcion}`)
                .send({
                    id_cita: citaId,
                    concepto: 'Consulta médica general + Análisis de sangre completo',
                    importe: 85.50,
                    observaciones: 'Incluye consulta, prescripción médica y análisis de laboratorio'
                });
            
            expect(nuevaFactura.status).toBe(201);
            expect(nuevaFactura.body.success).toBe(true);
            facturaId = nuevaFactura.body.data.id;
            console.log('   ✓ Factura generada');
            console.log(`   💰 Importe: €${nuevaFactura.body.data.importe}`);
            console.log(`   📄 Número: ${nuevaFactura.body.data.numero_factura}`);

            // ========================================
            // PASO 9: PROCESAMIENTO DE PAGO
            // ========================================
            console.log('\n💳 PASO 9: Procesando pago');
            
            const pagoFactura = await request(app)
                .put(`/facturas/${facturaId}/estado`)
                .set('Authorization', `Bearer ${authTokenRecepcion}`)
                .send({
                    estado: 'pagado',
                    observaciones: 'Pago recibido en efectivo. Transacción completada.'
                });
            
            expect(pagoFactura.status).toBe(200);
            expect(pagoFactura.body.success).toBe(true);
            console.log('   ✓ Pago procesado exitosamente');
            console.log('   💳 Método: Efectivo');

            // ========================================
            // PASO 10: VERIFICACIÓN FINAL DEL FLUJO
            // ========================================
            console.log('\n✅ PASO 10: Verificación final del flujo completo');
            
            // Verificar estado final de la cita
            const citaFinal = await Cita.findByPk(citaId);
            expect(citaFinal.estado).toBe('finalizado');
            console.log('   ✓ Cita: Finalizada correctamente');

            // Verificar receta creada
            const recetaFinal = await RecetaMedica.findByPk(recetaId, {
                include: [RecetaMedicamento]
            });
            expect(recetaFinal).toBeTruthy();
            expect(recetaFinal.RecetaMedicamentos.length).toBe(2);
            console.log('   ✓ Receta: Creada con 2 medicamentos');

            // Verificar prueba finalizada
            const pruebaFinal = await Prueba.findByPk(pruebaId);
            expect(pruebaFinal.estado).toBe('finalizado');
            expect(pruebaFinal.resultado).toContain('valores normales');
            console.log('   ✓ Prueba: Finalizada con resultados');

            // Verificar factura pagada
            const facturaFinal = await Factura.findByPk(facturaId);
            expect(facturaFinal.estado).toBe('pagado');
            expect(facturaFinal.fecha_pago).toBeTruthy();
            console.log('   ✓ Factura: Pagada y procesada');

            // Verificar historial completo del paciente
            const historialPaciente = await request(app)
                .get(`/citas/paciente/${testPaciente.id}`)
                .set('Authorization', `Bearer ${authTokenPaciente}`);
            
            expect(historialPaciente.status).toBe(200);
            expect(historialPaciente.body.data.length).toBe(1);
            console.log('   ✓ Historial: Actualizado correctamente');

            // ========================================
            // RESUMEN FINAL
            // ========================================
            console.log('\n🎉 === FLUJO COMPLETADO EXITOSAMENTE ===');
            console.log('\n📊 RESUMEN DE LA ATENCIÓN:');
            console.log(`   👤 Paciente: Elena Martínez (DNI: 12345678Z)`);
            console.log(`   👨‍⚕️ Médico: Dr. Roberto García (Medicina General)`);
            console.log(`   📅 Cita: ${fechaCita.toISOString().split('T')[0]} a las 10:30`);
            console.log(`   💊 Medicamentos prescritos: 2`);
            console.log(`   🔬 Pruebas realizadas: 1 (Análisis de sangre)`);
            console.log(`   💰 Facturación: €85.50 (PAGADO)`);
            console.log(`   📄 Número de factura: ${nuevaFactura.body.data.numero_factura}`);
            console.log('\n✅ Todos los procesos de ClinicLink funcionan correctamente');
            
            // Verificación final de integridad
            expect(citaId).toBeTruthy();
            expect(recetaId).toBeTruthy();
            expect(pruebaId).toBeTruthy();
            expect(facturaId).toBeTruthy();
        }, 60000); // Timeout extendido para el flujo completo
    });

    describe('Verificaciones de Integridad del Sistema', () => {
        test('debería mantener consistencia de datos entre todas las entidades', async () => {
            // Verificar que todos los IDs están relacionados correctamente
            const cita = await Cita.findByPk(citaId, {
                include: [
                    { model: Paciente, include: [Usuario] },
                    { model: Medico, include: [Usuario] }
                ]
            });
            
            const receta = await RecetaMedica.findByPk(recetaId, {
                include: [RecetaMedicamento]
            });
            
            const prueba = await Prueba.findByPk(pruebaId);
            
            const factura = await Factura.findByPk(facturaId);

            // Verificar relaciones
            expect(cita.id_paciente).toBe(testPaciente.id);
            expect(cita.id_medico).toBe(testMedico.id);
            expect(receta.id_cita).toBe(citaId);
            expect(prueba.id_cita).toBe(citaId);
            expect(factura.id_cita).toBe(citaId);

            // Verificar estados finales
            expect(cita.estado).toBe('finalizado');
            expect(prueba.estado).toBe('finalizado');
            expect(factura.estado).toBe('pagado');

            console.log('✅ Integridad de datos verificada correctamente');
        });

        test('debería validar permisos de acceso por roles', async () => {
            // Paciente no debería poder crear citas
            const citaNoAutorizada = await request(app)
                .post('/citas')
                .set('Authorization', `Bearer ${authTokenPaciente}`)
                .send({
                    id_paciente: testPaciente.id,
                    id_medico: testMedico.id,
                    fecha: '2024-12-31',
                    hora: '15:00'
                });
            
            expect(citaNoAutorizada.status).toBe(403);

            // Paciente no debería poder crear recetas
            const recetaNoAutorizada = await request(app)
                .post('/recetas')
                .set('Authorization', `Bearer ${authTokenPaciente}`)
                .send({
                    id_cita: citaId,
                    observaciones: 'Intento no autorizado'
                });
            
            expect(recetaNoAutorizada.status).toBe(403);

            console.log('✅ Control de acceso por roles funcionando correctamente');
        });
    });
});