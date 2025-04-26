const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Paciente = sequelize.define('Paciente', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    id_usuario: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'Usuario',
            key: 'id'
        },
    },
    dni: {
        type: DataTypes.STRING(9),
        allowNull: false,
        unique: true,
        validate: {
            is: {
                args: [/^\d{8}[A-Za-z]$/],
                msg: 'Error - DNI debe tener 8 números seguidos de 1 letra'
            },
        },
    },
    telefono: {
        type: DataTypes.STRING(15),
        allowNull: false,
        validate: {
            isNumeric: {
                msg: 'Error - Teléfono debe contener solo números'
            },
            len: {
                args: [9],
                msg: 'Error - Teléfono debe tener 9 caracteres'
            },
        },
    },
    fechaNacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            isDate: {
                msg: 'Error - Fecha de nacimiento inválida'
            },
            isBefore: {
                args: new Date().toISOString().split('T')[0],
                msg: 'Error - La fecha de nacimiento debe ser anterior a hoy'
            },
        },
    },
    direccion: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            len: {
                args: [5, 255],
                msg: 'Error - Dirección debe tener entre 5 y 255 caracteres'
            },
        },
    },
}, {
    timestamps: false,
    tableName: 'Paciente',
});

module.exports = Paciente;