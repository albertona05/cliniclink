const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Paciente = require('./pacienteModel');
const Medico = require('./medicoModel');

const Cita = sequelize.define('Cita', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    id_paciente: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: Paciente, // Relación con Paciente
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },
    fecha: {
        type: DataTypes.DATE,
        allowNull: false
    },
    hora: {
        type: DataTypes.TIME,
        allowNull: false
    },
    estado: {
        type: DataTypes.ENUM('espera', 'cancelado', 'finalizado'),
        allowNull: false,
        defaultValue: 'espera'
    },
    info: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
}, {
    timestamps: false,
    tableName: 'Cita'
});

module.exports = Cita;