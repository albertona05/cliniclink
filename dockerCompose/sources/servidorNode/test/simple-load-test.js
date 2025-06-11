const autocannon = require('autocannon');
const express = require('express');
const request = require('supertest');
const { Paciente } = require('../models');

// Mock del modelo para las pruebas
jest.mock('../models', () => ({
    Paciente: {
        findOne: jest.fn(),
        create: jest.fn(),
        findAll: jest.fn()
    }
}));

const pacienteController = require('../controllers/pacienteController');
const authController = require('../controllers/authController');

// Configurar aplicación de prueba
const app = express();
app.use(express.json());
app.get('/paciente/:id', pacienteController.obtenerPacientePorUsuario);
app.post('/auth/login', authController.login);
app.get('/health', (req, res) => res.json({ status: 'OK' }));

// Función para ejecutar prueba de carga simple
async function runLoadTest() {
    console.log('🚀 Iniciando prueba de carga simple...');
    
    // Configurar mocks
    Paciente.findOne.mockResolvedValue({
        id: 1,
        id_usuario: 123,
        nombre: 'Juan Pérez Test'
    });
    
    const server = app.listen(0); // Puerto aleatorio
    const port = server.address().port;
    
    console.log(`📡 Servidor de prueba iniciado en puerto ${port}`);
    
    try {
        // Configuración de la prueba de carga
        const result = await autocannon({
            url: `http://localhost:${port}`,
            connections: 10,
            duration: 30, // 30 segundos
            requests: [
                {
                    method: 'GET',
                    path: '/health'
                },
                {
                    method: 'GET',
                    path: '/paciente/123'
                },
                {
                    method: 'POST',
                    path: '/auth/login',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: 'test@example.com',
                        contrasena: 'password123'
                    })
                }
            ]
        });
        
        console.log('\n📊 RESULTADOS DE LA PRUEBA DE CARGA:');
        console.log('=====================================');
        console.log(`⏱️  Duración: ${result.duration}s`);
        console.log(`🔄 Requests totales: ${result.requests.total}`);
        console.log(`📈 Requests/segundo: ${result.requests.average}`);
        console.log(`⚡ Latencia promedio: ${result.latency.average}ms`);
        console.log(`🎯 Latencia p95: ${result.latency.p95}ms`);
        console.log(`🎯 Latencia p99: ${result.latency.p99}ms`);
        console.log(`✅ Requests exitosos: ${result.requests.total - result.errors}`);
        console.log(`❌ Errores: ${result.errors}`);
        console.log(`📊 Throughput: ${result.throughput.average} bytes/sec`);
        
        // Evaluación de resultados
        console.log('\n🔍 EVALUACIÓN:');
        console.log('===============');
        
        if (result.latency.p95 < 1000) {
            console.log('✅ Latencia P95 < 1000ms - EXCELENTE');
        } else if (result.latency.p95 < 2000) {
            console.log('⚠️  Latencia P95 < 2000ms - ACEPTABLE');
        } else {
            console.log('❌ Latencia P95 > 2000ms - NECESITA OPTIMIZACIÓN');
        }
        
        const errorRate = (result.errors / result.requests.total) * 100;
        if (errorRate < 1) {
            console.log('✅ Tasa de error < 1% - EXCELENTE');
        } else if (errorRate < 5) {
            console.log('⚠️  Tasa de error < 5% - ACEPTABLE');
        } else {
            console.log('❌ Tasa de error > 5% - CRÍTICO');
        }
        
        if (result.requests.average > 100) {
            console.log('✅ Throughput > 100 req/s - EXCELENTE');
        } else if (result.requests.average > 50) {
            console.log('⚠️  Throughput > 50 req/s - ACEPTABLE');
        } else {
            console.log('❌ Throughput < 50 req/s - NECESITA OPTIMIZACIÓN');
        }
        
    } catch (error) {
        console.error('❌ Error durante la prueba de carga:', error);
    } finally {
        server.close();
        console.log('\n🔚 Prueba de carga completada');
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    runLoadTest().catch(console.error);
}

module.exports = { runLoadTest };