const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const Paciente = require('./Paciente');
const Medico = require('./Medico');
const Cita = require('./Cita');

const RecetaMedica = sequelize.define('RecetaMedica', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    id_cita: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: Cita,
            key: 'id'
        }
    },
    id_medico: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: Medico,
            key: 'id'
        }
    },
    id_paciente: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: Paciente,
            key: 'id'
        }
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    fecha: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false,
    tableName: 'RecetaMedica'
});

module.exports = RecetaMedica;