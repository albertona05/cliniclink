const request = require('supertest');
const app = require('../../app');
const db = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const { Usuario, Paciente, Medico } = db;

describe('PacienteController Integration Tests', () => {
    let testUser, testPaciente, testMedico, testMedicoUser;
    let pacienteToken, medicoToken;
    
    beforeAll(async () => {
        // Sincronizar la base de datos
        await db.sequelize.sync({ force: true });
        
        // Crear usuario paciente de prueba
        const hashedPassword = await bcrypt.hash('password123', 10);
        testUser = await Usuario.create({
            nombre: 'Juan',
            apellidos: 'Pérez García',
            email: 'paciente@test.com',
            contrasena: hashedPassword,
            telefono: '123456789',
            rol: 'paciente',
            activo: true
        });
        
        // Crear perfil de paciente
        testPaciente = await Paciente.create({
            id_usuario: testUser.id,
            fecha_nacimiento: '1990-05-15',
            genero: 'M',
            direccion: 'Calle Test 123',
            numero_seguridad_social: '123456789012',
            contacto_emergencia: 'María Pérez - 987654321',
            alergias: 'Ninguna conocida',
            enfermedades_cronicas: 'Ninguna',
            medicamentos_actuales: 'Ninguno'
        });
        
        // Crear usuario médico de prueba
        testMedicoUser = await Usuario.create({
            nombre: 'Dr. Carlos',
            apellidos: 'López Martín',
            email: 'medico@test.com',
            contrasena: hashedPassword,
            telefono: '987654321',
            rol: 'medico',
            activo: true
        });
        
        // Crear perfil de médico
        testMedico = await Medico.create({
            id_usuario: testMedicoUser.id,
            especialidad: 'Medicina General',
            numero_colegiado: 'COL123456',
            horario_inicio: '09:00',
            horario_fin: '17:00'
        });
        
        // Generar tokens
        pacienteToken = jwt.sign(
            { id: testUser.id, email: testUser.email, rol: testUser.rol },
            process.env.JWT_SECRET || '1234',
            { expiresIn: '24h' }
        );
        
        medicoToken = jwt.sign(
            { id: testMedicoUser.id, email: testMedicoUser.email, rol: testMedicoUser.rol },
            process.env.JWT_SECRET || '1234',
            { expiresIn: '24h' }
        );
    });
    
    afterAll(async () => {
        await db.sequelize.close();
    });
    
    describe('GET /pacientes/usuario/:id', () => {
        test('Debe obtener paciente por id_usuario', async () => {
            const response = await request(app)
                .get(`/pacientes/usuario/${testUser.id}`)
                .set('Authorization', `Bearer ${pacienteToken}`);
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.id).toBe(testPaciente.id);
        });
        
        test('Debe retornar 404 para usuario sin perfil de paciente', async () => {
            const response = await request(app)
                .get(`/pacientes/usuario/99999`)
                .set('Authorization', `Bearer ${pacienteToken}`);
            
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.mensaje).toContain('No se encontró el paciente');
        });
        
        test('Debe requerir autenticación', async () => {
            const response = await request(app)
                .get(`/pacientes/usuario/${testUser.id}`);
            
            expect(response.status).toBe(401);
        });
    });
    
    describe('GET /pacientes/:id', () => {
        test('Debe obtener datos completos del paciente', async () => {
            const response = await request(app)
                .get(`/pacientes/${testPaciente.id}`)
                .set('Authorization', `Bearer ${medicoToken}`);
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.paciente).toBeDefined();
            expect(response.body.paciente.id).toBe(testPaciente.id);
            expect(response.body.paciente.fecha_nacimiento).toBeDefined();
            expect(response.body.paciente.genero).toBe('M');
            expect(response.body.paciente.Usuario).toBeDefined();
            expect(response.body.paciente.Usuario.nombre).toBe('Juan');
        });
        
        test('Debe retornar 404 para paciente inexistente', async () => {
            const response = await request(app)
                .get('/pacientes/99999')
                .set('Authorization', `Bearer ${medicoToken}`);
            
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.mensaje).toContain('Paciente no encontrado');
        });
    });
    
    describe('GET /pacientes', () => {
        test('Debe obtener lista de pacientes (solo médicos)', async () => {
            const response = await request(app)
                .get('/pacientes')
                .set('Authorization', `Bearer ${medicoToken}`);
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.pacientes)).toBe(true);
            expect(response.body.pacientes.length).toBeGreaterThan(0);
            
            const paciente = response.body.pacientes.find(p => p.id === testPaciente.id);
            expect(paciente).toBeDefined();
            expect(paciente.Usuario.nombre).toBe('Juan');
        });
        
        test('Debe denegar acceso a pacientes', async () => {
            const response = await request(app)
                .get('/pacientes')
                .set('Authorization', `Bearer ${pacienteToken}`);
            
            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.mensaje).toContain('Acceso denegado');
        });
    });
    
    describe('PUT /pacientes/:id', () => {
        test('Debe actualizar datos del paciente', async () => {
            const datosActualizados = {
                direccion: 'Nueva Dirección 456',
                telefono: '111222333',
                alergias: 'Alergia a penicilina',
                enfermedades_cronicas: 'Hipertensión',
                medicamentos_actuales: 'Enalapril 10mg'
            };
            
            const response = await request(app)
                .put(`/pacientes/${testPaciente.id}`)
                .set('Authorization', `Bearer ${pacienteToken}`)
                .send(datosActualizados);
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.mensaje).toContain('actualizado correctamente');
            
            // Verificar que los datos se actualizaron
            const pacienteActualizado = await Paciente.findByPk(testPaciente.id);
            expect(pacienteActualizado.direccion).toBe('Nueva Dirección 456');
            expect(pacienteActualizado.alergias).toBe('Alergia a penicilina');
        });
        
        test('Debe validar formato de fecha de nacimiento', async () => {
            const response = await request(app)
                .put(`/pacientes/${testPaciente.id}`)
                .set('Authorization', `Bearer ${pacienteToken}`)
                .send({
                    fecha_nacimiento: 'fecha-invalida'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.mensaje).toContain('Formato de fecha inválido');
        });
        
        test('Debe validar fecha de nacimiento futura', async () => {
            const fechaFutura = new Date();
            fechaFutura.setFullYear(fechaFutura.getFullYear() + 1);
            
            const response = await request(app)
                .put(`/pacientes/${testPaciente.id}`)
                .set('Authorization', `Bearer ${pacienteToken}`)
                .send({
                    fecha_nacimiento: fechaFutura.toISOString().split('T')[0]
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.mensaje).toContain('no puede ser futura');
        });
        
        test('Debe validar género', async () => {
            const response = await request(app)
                .put(`/pacientes/${testPaciente.id}`)
                .set('Authorization', `Bearer ${pacienteToken}`)
                .send({
                    genero: 'X' // Género inválido
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.mensaje).toContain('Género debe ser M o F');
        });
        
        test('Debe sanitizar input XSS', async () => {
            const response = await request(app)
                .put(`/pacientes/${testPaciente.id}`)
                .set('Authorization', `Bearer ${pacienteToken}`)
                .send({
                    direccion: '<script>alert("xss")</script>Dirección maliciosa'
                });
            
            expect(response.status).toBe(200);
            
            // Verificar que el script fue sanitizado
            const pacienteActualizado = await Paciente.findByPk(testPaciente.id);
            expect(pacienteActualizado.direccion).not.toContain('<script>');
            expect(pacienteActualizado.direccion).toContain('Dirección maliciosa');
        });
        
        test('Debe retornar 404 para paciente inexistente', async () => {
            const response = await request(app)
                .put('/pacientes/99999')
                .set('Authorization', `Bearer ${pacienteToken}`)
                .send({
                    direccion: 'Nueva dirección'
                });
            
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.mensaje).toContain('Paciente no encontrado');
        });
    });
    
    describe('GET /pacientes/:id/historial', () => {
        test('Debe obtener historial médico del paciente', async () => {
            const response = await request(app)
                .get(`/pacientes/${testPaciente.id}/historial`)
                .set('Authorization', `Bearer ${medicoToken}`);
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.historial).toBeDefined();
            expect(Array.isArray(response.body.historial.citas)).toBe(true);
            expect(Array.isArray(response.body.historial.recetas)).toBe(true);
            expect(Array.isArray(response.body.historial.pruebas)).toBe(true);
        });
        
        test('Debe denegar acceso a pacientes para ver historial de otros', async () => {
            // Crear otro paciente
            const otroUser = await Usuario.create({
                nombre: 'Otro',
                apellidos: 'Paciente',
                email: 'otro@test.com',
                contrasena: await bcrypt.hash('password123', 10),
                telefono: '555666777',
                rol: 'paciente',
                activo: true
            });
            
            const otroPaciente = await Paciente.create({
                id_usuario: otroUser.id,
                fecha_nacimiento: '1985-03-20',
                genero: 'F',
                direccion: 'Otra dirección',
                numero_seguridad_social: '987654321098'
            });
            
            const response = await request(app)
                .get(`/pacientes/${otroPaciente.id}/historial`)
                .set('Authorization', `Bearer ${pacienteToken}`);
            
            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            
            // Limpiar
            await otroPaciente.destroy();
            await otroUser.destroy();
        });
    });
    
    describe('Validaciones de seguridad', () => {
        test('Debe validar longitud de número de seguridad social', async () => {
            const response = await request(app)
                .put(`/pacientes/${testPaciente.id}`)
                .set('Authorization', `Bearer ${pacienteToken}`)
                .send({
                    numero_seguridad_social: '123' // Muy corto
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.mensaje).toContain('12 dígitos');
        });
        
        test('Debe validar formato de teléfono', async () => {
            const response = await request(app)
                .put(`/pacientes/${testPaciente.id}`)
                .set('Authorization', `Bearer ${pacienteToken}`)
                .send({
                    telefono: 'telefono-invalido'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.mensaje).toContain('Formato de teléfono inválido');
        });
        
        test('Debe prevenir inyección SQL', async () => {
            const response = await request(app)
                .put(`/pacientes/${testPaciente.id}`)
                .set('Authorization', `Bearer ${pacienteToken}`)
                .send({
                    direccion: "'; DROP TABLE pacientes; --"
                });
            
            // La operación debe completarse sin errores
            expect(response.status).toBe(200);
            
            // Verificar que la tabla sigue existiendo
            const pacienteCount = await Paciente.count();
            expect(pacienteCount).toBeGreaterThan(0);
        });
    });
    
    describe('Control de acceso por roles', () => {
        test('Médicos pueden acceder a datos de cualquier paciente', async () => {
            const response = await request(app)
                .get(`/pacientes/${testPaciente.id}`)
                .set('Authorization', `Bearer ${medicoToken}`);
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
        
        test('Pacientes solo pueden acceder a sus propios datos', async () => {
            // Crear otro paciente
            const otroUser = await Usuario.create({
                nombre: 'Otro',
                apellidos: 'Paciente Test',
                email: 'otro2@test.com',
                contrasena: await bcrypt.hash('password123', 10),
                telefono: '444555666',
                rol: 'paciente',
                activo: true
            });
            
            const otroPaciente = await Paciente.create({
                id_usuario: otroUser.id,
                fecha_nacimiento: '1988-07-10',
                genero: 'M',
                direccion: 'Dirección del otro paciente',
                numero_seguridad_social: '555666777888'
            });
            
            // Intentar acceder con token del primer paciente
            const response = await request(app)
                .get(`/pacientes/${otroPaciente.id}`)
                .set('Authorization', `Bearer ${pacienteToken}`);
            
            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
            
            // Limpiar
            await otroPaciente.destroy();
            await otroUser.destroy();
        });
    });
});