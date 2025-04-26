const express = require('express');
const body_parser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();


app.use(express.json())
app.use(body_parser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());


// Importación centralizada de modelos para evitar dependencias circulares
const sequelize = require('./config/database');
const Usuario = require('./models/usuarioModel');
const Paciente = require('./models/pacienteModel');
const Medico = require('./models/medicoModel');
const Recepcion = require('./models/recepcionModel');

// Establecer relaciones después de importar todos los modelos
Usuario.hasOne(Paciente, {
    foreignKey: 'id_usuario',
    as: 'pacienteInfo',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

Usuario.hasOne(Medico, {
    foreignKey: 'id_usuario',
    as: 'medicoInfo',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

Usuario.hasOne(Recepcion, {
    foreignKey: 'id_usuario',
    as: 'recepcionInfo',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

sequelize.authenticate()
    .then(() => { console.log("Se ha conectado a la base de datos correctamente");})
    .catch((error) => { console.error("Error - No se ha podido conectar a la base de datos",error);});

sequelize.sync({ alter: true })
    .then(() => console.log('Se han creado las tablas correctamente'))
    .catch(() => console.error('Error - No se ha podido crear las tablas correctamente'));
    
//Rutas
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