const Sequelize = require('sequelize');
const sequelize = require('../config/database');

// Importación de modelos
const Usuario = require('./usuarioModel')(sequelize, Sequelize.DataTypes);
const Paciente = require('./pacienteModel')(sequelize, Sequelize.DataTypes);
const Medico = require('./medicoModel')(sequelize, Sequelize.DataTypes);
const Recepcion = require('./recepcionModel')(sequelize, Sequelize.DataTypes);
const Cita = require('./citaModel')(sequelize, Sequelize.DataTypes);
const RecetaMedica = require('./recetaMedicaModel')(sequelize, Sequelize.DataTypes);
const Prueba = require('./pruebaModel')(sequelize, Sequelize.DataTypes);
const Factura = require('./facturaModel')(sequelize, Sequelize.DataTypes);
const Medicamento = require('./medicamentoModel')(sequelize, Sequelize.DataTypes);
const RecetaMedicamento = require('./recetaMedicamentoModel')(sequelize, Sequelize.DataTypes);

// Configuración de asociaciones entre los modelos
// Usuario-Paciente, Medico, Recepcion
Usuario.hasOne(Paciente, {
    foreignKey: 'id_usuario',
    as: 'paciente',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

Usuario.hasOne(Medico, {
    foreignKey: 'id_usuario',
    as: 'medico',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

Usuario.hasOne(Recepcion, {
    foreignKey: 'id_usuario',
    as: 'recepcion',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

// Paciente-Cita, RecetaMedica
Paciente.belongsTo(Usuario, {
    foreignKey: 'id_usuario',
    as: 'usuario',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

Paciente.hasMany(Cita, {
    foreignKey: 'id_paciente',
    as: 'citas'
});

Paciente.hasMany(RecetaMedica, {
    foreignKey: 'id_paciente',
    as: 'recetas'
});

// Medico-Cita, RecetaMedica
Medico.belongsTo(Usuario, {
    foreignKey: 'id_usuario',
    as: 'usuario',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

Medico.hasMany(Cita, {
    foreignKey: 'id_medico',
    as: 'citas'
});

Medico.hasMany(RecetaMedica, {
    foreignKey: 'id_medico',
    as: 'recetas'
});

// Cita-RecetaMedica
Cita.belongsTo(Paciente, {
    foreignKey: 'id_paciente',
    as: 'paciente'
});

Cita.belongsTo(Medico, {
    foreignKey: 'id_medico',
    as: 'medico'
});

Cita.hasMany(RecetaMedica, {
    foreignKey: 'id_cita',
    as: 'recetas'
});

// RecetaMedica-Cita, Medico, Paciente
RecetaMedica.belongsTo(Cita, {
    foreignKey: 'id_cita',
    as: 'cita'
});

RecetaMedica.belongsTo(Medico, {
    foreignKey: 'id_medico',
    as: 'medico'
});

RecetaMedica.belongsTo(Paciente, {
    foreignKey: 'id_paciente',
    as: 'paciente'
});

// Recepcion-Usuario
Recepcion.belongsTo(Usuario, {
    foreignKey: 'id_usuario',
    as: 'usuario'
});

// Factura-Paciente
Factura.belongsTo(Paciente, {
    foreignKey: 'id_paciente',
    as: 'paciente'
});

// Prueba-Medico
Prueba.belongsTo(Medico, {
    foreignKey: 'id_medicoManda',
    as: 'medico'
});

// Asociaciones para RecetaMedica y Medicamento
RecetaMedica.hasMany(RecetaMedicamento, {
    foreignKey: 'id_receta',
    as: 'recetaMedicamentos'
});

Medicamento.hasMany(RecetaMedicamento, {
    foreignKey: 'id_medicamento',
    as: 'recetaMedicamentos'
});

// Exportamos los modelos
module.exports = {
    sequelize,
    Sequelize,
    Usuario,
    Paciente,
    Medico,
    Recepcion,
    Cita,
    RecetaMedica,
    Prueba,
    Factura,
    Medicamento,
    RecetaMedicamento
};