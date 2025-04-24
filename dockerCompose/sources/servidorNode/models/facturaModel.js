const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Paciente = require('./pacienteModel');

const Factura = sequelize.define('Factura', {
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
    monto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: {
                msg: 'El monto debe ser un número válido con hasta dos decimales'
            },
            min: {
                args: [0.01],
                msg: 'El monto debe ser mayor a 0'
            }
        }
    },
    estado: {
        type: DataTypes.ENUM('en espera', 'cobrado'),
        allowNull: false,
        defaultValue: 'en espera'
    },
    fecha: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: false,
    tableName: 'Factura',
});

module.exports = Factura;
