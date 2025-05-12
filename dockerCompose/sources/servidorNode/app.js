const express = require('express');
const body_parser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

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
sequelize.sync({ alter: false })
  .then(() => {
    console.log('Se han creado las tablas correctamente');
  })
  .catch((error) => {
    console.error('Error - No se ha podido crear las tablas correctamente', error);
  });

// Rutas
const authRoutes = require('./routes/authRoutes');
const globalRoutes = require('./routes/globalRoutes');
const medicoRoutes = require('./routes/medicoRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');
const recepcionRoutes = require('./routes/recepcionRoutes');

app.use(authRoutes);
app.use(globalRoutes);
app.use(medicoRoutes);
app.use(pacienteRoutes);
app.use(recepcionRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Se ha iniciado correctamente en http://localhost:${PORT}/`);
});
