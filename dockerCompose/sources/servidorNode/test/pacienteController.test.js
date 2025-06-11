const request = require('supertest');
const express = require('express');
const { Paciente } = require('../models');

// Mock del modelo Paciente
jest.mock('../models', () => ({
    Paciente: {
        findOne: jest.fn(),
        create: jest.fn(),
        findAll: jest.fn()
    }
}));

// Importar el controlador después del mock
const pacienteController = require('../controllers/pacienteController');

const app = express();
app.use(express.json());
app.get('/paciente/:id', pacienteController.obtenerPacientePorUsuario);

describe('PacienteController Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /paciente/:id', () => {
        test('debería devolver paciente existente', async () => {
            const mockPaciente = {
                id: 1,
                id_usuario: 123,
                nombre: 'Juan Pérez'
            };

            Paciente.findOne.mockResolvedValue(mockPaciente);

            const response = await request(app)
                .get('/paciente/123');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.id).toBe(1);
            expect(Paciente.findOne).toHaveBeenCalledWith({
                where: { id_usuario: '123' }
            });
        });

        test('debería devolver 404 para paciente no encontrado', async () => {
            Paciente.findOne.mockResolvedValue(null);

            const response = await request(app)
                .get('/paciente/999');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.mensaje).toBe('No se encontró el paciente');
        });

        test('debería manejar errores de base de datos', async () => {
            Paciente.findOne.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/paciente/123');

            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.mensaje).toBe('Error al obtener paciente');
        });
    });
});