const request = require('supertest');
const express = require('express');

// Mock de la base de datos y modelos antes de importar el controlador
jest.mock('../config/database');
jest.mock('../models', () => ({
    Usuario: {
        findOne: jest.fn()
    },
    Paciente: {
        findOne: jest.fn()
    },
    Medico: {
        findOne: jest.fn()
    }
}));

const authController = require('../controllers/authController');
const sequelize = require('../config/database');

const app = express();
app.use(express.json());
app.post('/login', authController.login);

describe('AuthController Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /login', () => {
        test('debería fallar con credenciales faltantes', async () => {
            const response = await request(app)
                .post('/login')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Email y contraseña son requeridos');
        });

        test('debería fallar con formato de email inválido', async () => {
            const response = await request(app)
                .post('/login')
                .send({
                    email: 'alberto.com',
                    contrasena: 'password123'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Formato de email inválido');
        });

        test('debería fallar con contraseña muy corta', async () => {
            const response = await request(app)
                .post('/login')
                .send({
                    email: 'test@example.com',
                    contrasena: '123'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('debe tener al menos 8 caracteres');
        });
    });
});