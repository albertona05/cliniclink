const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Medico = require('./medicoModel');

// Aseguramos que la tabla Medico exista antes de crear la relación
Medico.sync();

const Prueba = sequelize.define('Prueba', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    id_medicoManda: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: Medico, // Relación con Medico
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },
}, {
    timestamps: false,
    tableName: 'Prueba'
});

module.exports = Prueba;