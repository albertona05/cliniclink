// Configuración global para las pruebas de Jest
require('dotenv').config({ path: '.env.test' });

// Configurar el entorno de pruebas
process.env.NODE_ENV = 'test';

// Aumentar el timeout para operaciones de base de datos
jest.setTimeout(30000);

// Configuración global antes de todas las pruebas
beforeAll(async () => {
  // Aquí puedes agregar configuración adicional si es necesaria
  console.log('🧪 Iniciando configuración de pruebas...');
  console.log('📊 Base de datos de pruebas:', process.env.DB_NAME);
});

// Limpieza después de todas las pruebas
afterAll(async () => {
  console.log('🧹 Limpiando después de las pruebas...');
  // Cerrar conexiones de base de datos si es necesario
  await new Promise(resolve => setTimeout(resolve, 1000));
});