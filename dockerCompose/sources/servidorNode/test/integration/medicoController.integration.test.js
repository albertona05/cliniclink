const request = require('supertest');
const app = require('../../app');
const db = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { Usuario, Medico, Paciente, Cita, RecetaMedica, Medicamento } = db;

describe('MedicoController Integration Tests', () => {
    let testMedicoUser, testMedico, testPacienteUser, testPaciente;
    let medicoToken, pacienteToken;
    let testCita, testMedicamento;
    
    beforeAll(async () => {
        // Sincronizar la base de datos
        await db.sequelize.sync({ force: true });
        
        // Crear usuario médico de prueba
        const hashedPassword = await bcrypt.hash('password123', 10);
        testMedicoUser = await Usuario.create({
            nombre: 'Dr. Ana',
            apellidos: 'García López',
            email: 'medico@test.com',
            contrasena: hashedPassword,
            telefono: '123456789',
            rol: 'medico',
            activo: true
        });
        
        // Crear perfil de médico
        testMedico = await Medico.create({
            id_usuario: testMedicoUser.id,
            especialidad: 'Cardiología',
            numero_colegiado: 'COL123456',
            horario_inicio: '09:00',
            horario_fin: '17:00'
        });
        
        // Crear usuario paciente de prueba
        testPacienteUser = await Usuario.create({
            nombre: 'María',
            apellidos: 'Rodríguez Pérez',
            email: 'paciente@test.com',
            contrasena: hashedPassword,
            telefono: '987654321',
            rol: 'paciente',
            activo: true
        });
        
        // Crear perfil de paciente
        testPaciente = await Paciente.create({
            id_usuario: testPacienteUser.id,
            fecha_nacimiento: '1985-03-15',
            genero: 'F',
            direccion: 'Calle Paciente 123',
            numero_seguridad_social: '123456789012'
        });
        
        // Crear medicamento de prueba
        testMedicamento = await Medicamento.create({
            nombre: 'Paracetamol',
            descripcion: 'Analgésico y antipirético',
            dosis_recomendada: '500mg cada 8 horas',
            contraindicaciones: 'Alergia al paracetamol',
            efectos_secundarios: 'Náuseas, vómitos'
        });
        
        // Crear cita de prueba
        const fechaCita = new Date();
        fechaCita.setDate(fechaCita.getDate() + 1); // Mañana
        
        testCita = await Cita.create({
            id_paciente: testPaciente.id,
            id_medico: testMedico.id,
            fecha: fechaCita.toISOString().split('T')[0],
            hora: '10:00',
            motivo: 'Consulta de rutina',
            estado: 'programada'
        });
        
        // Generar tokens
        medicoToken = jwt.sign(
            { id: testMedicoUser.id, email: testMedicoUser.email, rol: testMedicoUser.rol },
            process.env.JWT_SECRET || '1234',
            { expiresIn: '24h' }
        );
        
        pacienteToken = jwt.sign(
            { id: testPacienteUser.id, email: testPacienteUser.email, rol: testPacienteUser.rol },
            process.env.JWT_SECRET || '1234',
            { expiresIn: '24h' }
        );
    });
    
    afterAll(async () => {
        await db.sequelize.close();
    });
    
    beforeEach(async () => {
        // Limpiar recetas antes de cada test
        await RecetaMedica.destroy({ where: {} });
    });
    
    describe('POST /medicos/citas-dia', () => {
        test('Debe obtener citas del médico para una fecha específica', async () => {
            const fechaCita = testCita.fecha;
            
            const response = await request(app)
                .post('/medicos/citas-dia')
                .set('Authorization', `Bearer ${medicoToken}`)
                .send({
                    fecha: fechaCita
                });
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.citas)).toBe(true);
            expect(response.body.citas.length).toBeGreaterThan(0);
            
            const cita = response.body.citas.find(c => c.id === testCita.id);
            expect(cita).toBeDefined();
            expect(cita.motivo).toBe('Consulta de rutina');
            expect(cita.Paciente).toBeDefined();
            expect(cita.Paciente.Usuario.nombre).toBe('María');
        });
        
        test('Debe retornar array vacío para fecha sin citas', async () => {
            const fechaSinCitas = new Date();
            fechaSinCitas.setDate(fechaSinCitas.getDate() + 10);
            
            const response = await request(app)
                .post('/medicos/citas-dia')
                .set('Authorization', `Bearer ${medicoToken}`)
                .send({
                    fecha: fechaSinCitas.toISOString().split('T')[0]
                });
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.citas)).toBe(true);
            expect(response.body.citas.length).toBe(0);
        });
        
        test('Debe validar fecha requerida', async () => {
            const response = await request(app)
                .post('/medicos/citas-dia')
                .set('Authorization', `Bearer ${medicoToken}`)
                .send({});
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.mensaje).toContain('La fecha es requerida');
        });
        
        test('Debe denegar acceso a no médicos', async () => {
            const response = await request(app)
                .post('/medicos/citas-dia')
                .set('Authorization', `Bearer ${pacienteToken}`)
                .send({
                    fecha: testCita.fecha
                });
            
            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.mensaje).toContain('Acceso denegado');
        });
    });
    
    describe('POST /medicos/finalizar-cita', () => {
        test('Debe finalizar cita con diagnóstico y observaciones', async () => {
            const response = await request(app)
                .post('/medicos/finalizar-cita')
                .set('Authorization', `Bearer ${medicoToken}`)
                .send({
                    id_cita: testCita.id,
                    diagnostico: 'Paciente en buen estado general',
                    observaciones: 'Se recomienda seguimiento en 6 meses',
                    tratamiento: 'Dieta equilibrada y ejercicio'
                });
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.mensaje).toContain('finalizada correctamente');
            
            // Verificar que la cita se actualizó
            const citaActualizada = await Cita.findByPk(testCita.id);
            expect(citaActualizada.estado).toBe('finalizada');
            expect(citaActualizada.diagnostico).toBe('Paciente en buen estado general');
            expect(citaActualizada.observaciones).toBe('Se recomienda seguimiento en 6 meses');
        });
        
        test('Debe validar campos requeridos para finalizar cita', async () => {
            const response = await request(app)
                .post('/medicos/finalizar-cita')
                .set('Authorization', `Bearer ${medicoToken}`)
                .send({
                    id_cita: testCita.id
                    // Faltan diagnóstico y observaciones
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.mensaje).toContain('requeridos');
        });
        
        test('Debe retornar 404 para cita inexistente', async () => {
            const response = await request(app)
                .post('/medicos/finalizar-cita')
                .set('Authorization', `Bearer ${medicoToken}`)
                .send({
                    id_cita: 99999,
                    diagnostico: 'Diagnóstico test',
                    observaciones: 'Observaciones test'
                });
            
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.mensaje).toContain('Cita no encontrada');
        });
        
        test('Debe validar que el médico sea propietario de la cita', async () => {
            // Crear otro médico
            const otroMedicoUser = await Usuario.create({
                nombre: 'Dr. Pedro',
                apellidos: 'Martínez Silva',
                email: 'otromedico@test.com',
                contrasena: await bcrypt.hash('password123', 10),
                telefono: '555666777',
                rol: 'medico',
                activo: true
            });
            
            const otroMedico = await Medico.create({
                id_usuario: otroMedicoUser.id,
                especialidad: 'Neurología',
                numero_colegiado: 'COL789012',
                horario_inicio: '08:00',
                horario_fin: '16:00'
            });
            
            const otroMedicoToken = jwt.sign(
                { id: otroMedicoUser.id, email: otroMedicoUser.email, rol: otroMedicoUser.rol },
                process.env.JWT_SECRET || '1234',
                { expiresIn: '24h' }
            );
            
            const response = await request(app)
                .post('/medicos/finalizar-cita')
                .set('Authorization', `Bearer ${otroMedicoToken}`)
                .send({
                    id_cita: testCita.id,
                    diagnostico: 'Diagnóstico no autorizado',
                    observaciones: 'Observaciones no autorizadas'
                });
            
            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.mensaje).toContain('No tiene permisos');
            
            // Limpiar
            await otroMedico.destroy();
            await otroMedicoUser.destroy();
        });
    });
    
    describe('POST /medicos/crear-receta', () => {
        test('Debe crear receta médica con medicamentos', async () => {
            const response = await request(app)
                .post('/medicos/crear-receta')
                .set('Authorization', `Bearer ${medicoToken}`)
                .send({
                    id_cita: testCita.id,
                    medicamentos: [
                        {
                            id_medicamento: testMedicamento.id,
                            cantidad: 2,
                            posologia: 'Tomar 1 comprimido cada 8 horas'
                        }
                    ],
                    observaciones: 'Tomar con alimentos'
                });
            
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.mensaje).toContain('creada correctamente');
            expect(response.body.receta).toBeDefined();
            expect(response.body.receta.id).toBeDefined();
            
            // Verificar que la receta se creó en la base de datos
            const recetaCreada = await RecetaMedica.findByPk(response.body.receta.id);
            expect(recetaCreada).toBeDefined();
            expect(recetaCreada.id_cita).toBe(testCita.id);
            expect(recetaCreada.observaciones).toBe('Tomar con alimentos');
        });
        
        test('Debe validar campos requeridos para crear receta', async () => {
            const response = await request(app)
                .post('/medicos/crear-receta')
                .set('Authorization', `Bearer ${medicoToken}`)
                .send({
                    // Faltan campos requeridos
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.mensaje).toContain('requeridos');
        });
        
        test('Debe validar que la cita exista', async () => {
            const response = await request(app)
                .post('/medicos/crear-receta')
                .set('Authorization', `Bearer ${medicoToken}`)
                .send({
                    id_cita: 99999,
                    medicamentos: [
                        {
                            id_medicamento: testMedicamento.id,
                            cantidad: 1,
                            posologia: 'Test'
                        }
                    ]
                });
            
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.mensaje).toContain('Cita no encontrada');
        });
        
        test('Debe validar que el medicamento exista', async () => {
            const response = await request(app)
                .post('/medicos/crear-receta')
                .set('Authorization', `Bearer ${medicoToken}`)
                .send({
                    id_cita: testCita.id,
                    medicamentos: [
                        {
                            id_medicamento: 99999, // Medicamento inexistente
                            cantidad: 1,
                            posologia: 'Test'
                        }
                    ]
                });
            
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.mensaje).toContain('Medicamento no encontrado');
        });
        
        test('Debe validar cantidad positiva de medicamentos', async () => {
            const response = await request(app)
                .post('/medicos/crear-receta')
                .set('Authorization', `Bearer ${medicoToken}`)
                .send({
                    id_cita: testCita.id,
                    medicamentos: [
                        {
                            id_medicamento: testMedicamento.id,
                            cantidad: -1, // Cantidad negativa
                            posologia: 'Test'
                        }
                    ]
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.mensaje).toContain('debe ser positiva');
        });
    });
    
    describe('GET /medicos/pacientes', () => {
        test('Debe obtener lista de pacientes del médico', async () => {
            const response = await request(app)
                .get('/medicos/pacientes')
                .set('Authorization', `Bearer ${medicoToken}`);
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.pacientes)).toBe(true);
            
            // Debe incluir al paciente que tiene cita con este médico
            const pacienteEncontrado = response.body.pacientes.find(
                p => p.id === testPaciente.id
            );
            expect(pacienteEncontrado).toBeDefined();
            expect(pacienteEncontrado.Usuario.nombre).toBe('María');
        });
        
        test('Debe denegar acceso a no médicos', async () => {
            const response = await request(app)
                .get('/medicos/pacientes')
                .set('Authorization', `Bearer ${pacienteToken}`);
            
            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.mensaje).toContain('Acceso denegado');
        });
    });
    
    describe('Validaciones de seguridad', () => {
        test('Debe sanitizar input XSS en diagnóstico', async () => {
            const response = await request(app)
                .post('/medicos/finalizar-cita')
                .set('Authorization', `Bearer ${medicoToken}`)
                .send({
                    id_cita: testCita.id,
                    diagnostico: '<script>alert("xss")</script>Diagnóstico normal',
                    observaciones: 'Observaciones normales'
                });
            
            expect(response.status).toBe(200);
            
            // Verificar que el script fue sanitizado
            const citaActualizada = await Cita.findByPk(testCita.id);
            expect(citaActualizada.diagnostico).not.toContain('<script>');
            expect(citaActualizada.diagnostico).toContain('Diagnóstico normal');
        });
        
        test('Debe prevenir inyección SQL', async () => {
            const response = await request(app)
                .post('/medicos/finalizar-cita')
                .set('Authorization', `Bearer ${medicoToken}`)
                .send({
                    id_cita: testCita.id,
                    diagnostico: "'; DROP TABLE citas; --",
                    observaciones: 'Observaciones test'
                });
            
            // La operación debe completarse sin errores
            expect(response.status).toBe(200);
            
            // Verificar que la tabla sigue existiendo
            const citaCount = await Cita.count();
            expect(citaCount).toBeGreaterThan(0);
        });
        
        test('Debe requerir autenticación para todas las rutas', async () => {
            const rutas = [
                { method: 'post', path: '/medicos/citas-dia' },
                { method: 'post', path: '/medicos/finalizar-cita' },
                { method: 'post', path: '/medicos/crear-receta' },
                { method: 'get', path: '/medicos/pacientes' }
            ];
            
            for (const ruta of rutas) {
                const response = await request(app)[ruta.method](ruta.path);
                expect(response.status).toBe(401);
            }
        });
    });
    
    describe('Validaciones de datos médicos', () => {
        test('Debe validar longitud máxima de diagnóstico', async () => {
            const diagnosticoLargo = 'A'.repeat(1001); // Más de 1000 caracteres
            
            const response = await request(app)
                .post('/medicos/finalizar-cita')
                .set('Authorization', `Bearer ${medicoToken}`)
                .send({
                    id_cita: testCita.id,
                    diagnostico: diagnosticoLargo,
                    observaciones: 'Observaciones normales'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.mensaje).toContain('demasiado largo');
        });
        
        test('Debe validar posología de medicamentos', async () => {
            const response = await request(app)
                .post('/medicos/crear-receta')
                .set('Authorization', `Bearer ${medicoToken}`)
                .send({
                    id_cita: testCita.id,
                    medicamentos: [
                        {
                            id_medicamento: testMedicamento.id,
                            cantidad: 1,
                            posologia: '' // Posología vacía
                        }
                    ]
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.mensaje).toContain('Posología es requerida');
        });
    });
});