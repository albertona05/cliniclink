const request = require('supertest');
const app = require('../../app');
const db = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { Usuario } = db;

describe('AuthController Integration Tests', () => {
    let testUser;
    
    beforeAll(async () => {
        // Sincronizar la base de datos
        await db.sequelize.sync({ force: true });
        
        // Crear usuario de prueba
        const hashedPassword = await bcrypt.hash('password123', 10);
        testUser = await Usuario.create({
            nombre: 'Test',
            apellidos: 'User',
            email: 'test@example.com',
            contrasena: hashedPassword,
            telefono: '123456789',
            rol: 'paciente',
            activo: true
        });
    });
    
    afterAll(async () => {
        await db.sequelize.close();
    });
    
    beforeEach(async () => {
        // Limpiar intentos de login fallidos
        jest.clearAllMocks();
    });
    
    describe('POST /auth/login', () => {
        test('Debe autenticar usuario con credenciales válidas', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    contrasena: 'password123'
                });
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.token).toBeDefined();
            expect(response.body.usuario).toBeDefined();
            expect(response.body.usuario.email).toBe('test@example.com');
            expect(response.body.usuario.rol).toBe('paciente');
            expect(response.body.usuario.contrasena).toBeUndefined();
        });
        
        test('Debe rechazar credenciales inválidas', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    contrasena: 'wrongpassword'
                });
            
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Credenciales inválidas');
            expect(response.body.token).toBeUndefined();
        });
        
        test('Debe rechazar email inexistente', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    contrasena: 'password123'
                });
            
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Credenciales inválidas');
        });
        
        test('Debe validar formato de email', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'invalid-email',
                    contrasena: 'password123'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Formato de email inválido');
        });
        
        test('Debe validar campos requeridos', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({});
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Email y contraseña son requeridos');
        });
        
        test('Debe validar longitud mínima de contraseña', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    contrasena: '123'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('La contraseña debe tener al menos 8 caracteres');
        });
        
        test('Debe rechazar usuario inactivo', async () => {
            // Crear usuario inactivo
            const hashedPassword = await bcrypt.hash('password123', 10);
            const inactiveUser = await Usuario.create({
                nombre: 'Inactive',
                apellidos: 'User',
                email: 'inactive@example.com',
                contrasena: hashedPassword,
                telefono: '987654321',
                rol: 'paciente',
                activo: false
            });
            
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'inactive@example.com',
                    contrasena: 'password123'
                });
            
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Cuenta desactivada');
            
            // Limpiar
            await inactiveUser.destroy();
        });
        
        test('Debe generar token JWT válido', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    contrasena: 'password123'
                });
            
            expect(response.status).toBe(200);
            expect(response.body.token).toBeDefined();
            
            // Verificar que el token es válido
            const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET || '1234');
            expect(decoded.id).toBe(testUser.id);
            expect(decoded.email).toBe(testUser.email);
            expect(decoded.rol).toBe(testUser.rol);
        });
        
        test('Debe sanitizar input XSS', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: '<script>alert("xss")</script>test@example.com',
                    contrasena: 'password123'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            // El email sanitizado no debe contener scripts
            expect(response.body.message).toContain('Formato de email inválido');
        });
    });
    
    describe('Middleware de autenticación', () => {
        let validToken;
        
        beforeEach(async () => {
            // Generar token válido para las pruebas
            const loginResponse = await request(app)
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    contrasena: 'password123'
                });
            validToken = loginResponse.body.token;
        });
        
        test('Debe permitir acceso con token válido', async () => {
            // Usar una ruta protegida para probar el middleware
            const response = await request(app)
                .get('/pacientes/usuario/' + testUser.id)
                .set('Authorization', `Bearer ${validToken}`);
            
            // No debe ser 401 (no autorizado)
            expect(response.status).not.toBe(401);
        });
        
        test('Debe rechazar acceso sin token', async () => {
            const response = await request(app)
                .get('/pacientes/usuario/' + testUser.id);
            
            expect(response.status).toBe(401);
        });
        
        test('Debe rechazar token inválido', async () => {
            const response = await request(app)
                .get('/pacientes/usuario/' + testUser.id)
                .set('Authorization', 'Bearer invalid-token');
            
            expect(response.status).toBe(401);
        });
        
        test('Debe rechazar token expirado', async () => {
            // Crear token expirado
            const expiredToken = jwt.sign(
                { id: testUser.id, email: testUser.email, rol: testUser.rol },
                process.env.JWT_SECRET || '1234',
                { expiresIn: '-1h' } // Token expirado hace 1 hora
            );
            
            const response = await request(app)
                .get('/pacientes/usuario/' + testUser.id)
                .set('Authorization', `Bearer ${expiredToken}`);
            
            expect(response.status).toBe(401);
        });
    });
    
    describe('Rate Limiting', () => {
        test('Debe aplicar límite de intentos de login', async () => {
            const invalidCredentials = {
                email: 'test@example.com',
                contrasena: 'wrongpassword'
            };
            
            // Hacer múltiples intentos fallidos
            const promises = [];
            for (let i = 0; i < 6; i++) {
                promises.push(
                    request(app)
                        .post('/auth/login')
                        .send(invalidCredentials)
                );
            }
            
            const responses = await Promise.all(promises);
            
            // Los primeros 5 intentos deben ser 401 (credenciales inválidas)
            for (let i = 0; i < 5; i++) {
                expect(responses[i].status).toBe(401);
            }
            
            // El 6to intento debe ser bloqueado por rate limiting
            expect(responses[5].status).toBe(429);
            expect(responses[5].body.message).toContain('Demasiados intentos');
        }, 10000); // Timeout extendido para esta prueba
    });
    
    describe('Seguridad', () => {
        test('No debe exponer información sensible en respuestas', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    contrasena: 'password123'
                });
            
            expect(response.status).toBe(200);
            expect(response.body.usuario.contrasena).toBeUndefined();
            expect(response.body.usuario.id).toBeDefined();
            expect(response.body.usuario.email).toBeDefined();
            expect(response.body.usuario.rol).toBeDefined();
        });
        
        test('Debe manejar inyección SQL en email', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({
                    email: "'; DROP TABLE usuarios; --",
                    contrasena: 'password123'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            
            // Verificar que la tabla usuarios sigue existiendo
            const userCount = await Usuario.count();
            expect(userCount).toBeGreaterThan(0);
        });
    });
});