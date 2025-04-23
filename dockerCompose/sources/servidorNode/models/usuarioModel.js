const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
    id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: {
                msg: 'Error - Email Inválido'
            }
        }
    },
    contrasena: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    rol: {
        type: DataTypes.ENUM('paciente', 'medico', 'recepcion'),
        allowNull: false,
        defaultValue: 'paciente'
    },
}, {
    timestamps: false,
    tableName: 'Usuario',
});

Usuario.hasOne(require('./pacienteModel'), {
    foreignKey: 'id_usuario',
    as: 'paciente',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

Usuario.hasOne(require('./medicoModel'), {
    foreignKey: 'id_usuario',
    as: 'medico',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

Usuario.hasOne(require('./recepcionModel'), {
    foreignKey: 'id_usuario',
    as: 'recepcion',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

module.exports = Usuario;