const express = require('express');
const body_parser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const PORT = process.env.PORT || 3000;

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json())
app.use(body_parser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cors());


const sequelize = require('./config/database');
sequelize.authenticate()
    .then(() => { console.log("Se ha conectado a la base de datos correctamente");})
    .catch((error) => { console.error("Error - No se ha podido conectar a la base de datos",error);});

sequelize.sync({ alter: true })
    .then(() => console.log('Se han creado las tablas correctamente'))
    .catch(() => console.error('Error - No se ha podido crear las tablas correctamente'));

//const escuelaRoutes = require('./routes/escuelaRoutes');
//app.use(escuelaRoutes);

app.listen(PORT, () => {
    console.log(`Se ha iniciado correctamente en http://localhost:${PORT}/`);
});