const express = require('express');
const body_parser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs').promises;

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(body_parser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));


const corsOptions = {
  origin: 'http://localhost:4200',  // Permitimos solo esta dirección IP
  methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Métodos que puedes permitir
  allowedHeaders: ['Content-Type', 'Authorization'],  // Cabeceras permitidas
};

app.use(cors(corsOptions))


// Importación centralizada de modelos y asociaciones
const { sequelize, setupAssociations } = require('./models');

// Conectar con la base de datos
sequelize.authenticate()
  .then(() => {
    console.log("Se ha conectado a la base de datos correctamente");
  })
  .catch((error) => {
    console.error("Error - No se ha podido conectar a la base de datos", error);
  });

// Sincronizar tablas y asociaciones
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Se han creado/actualizado las tablas correctamente');
    
    // Ejecutar el script SQL con datos de ejemplo
    const { exec } = require('child_process');
    console.log('Cargando datos de ejemplo desde bbdd.sql...');
    exec('mysql -h db -u root -proot clinicLink < /app/bbdd.sql', (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al ejecutar el script SQL: ${error}`);
        return;
      }
      console.log('Datos de ejemplo cargados correctamente');
    });
  })
  .catch((error) => {
    console.error('Error - No se ha podido crear las tablas correctamente', error);
  });

// Rutas
const authRoutes = require('./routes/authRoutes');
const globalRoutes = require('./routes/globalRoutes');
const medicoRoutes = require('./routes/medicoRoutes');
const pruebaRoutes = require('./routes/pruebaRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');
const recepcionRoutes = require('./routes/recepcionRoutes');
const medicamentoRoutes = require('./routes/medicamentoRoutes');
const fileRoutes = require('./routes/fileRoutes');

app.use(authRoutes);
app.use(globalRoutes);
app.use(medicoRoutes);
app.use(pruebaRoutes);
app.use(pacienteRoutes);
app.use(recepcionRoutes);
app.use(medicamentoRoutes);
app.use(fileRoutes);

// Crear directorio temporal para uploads si no existe
fs.mkdir('/tmp/uploads', { recursive: true }).catch(console.error);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Se ha iniciado correctamente en http://localhost:${PORT}/`);
});
