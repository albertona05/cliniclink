const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./usuarioModel');

// Sincronizamos la tabla Usuario para asegurar que exista antes de establecer relaciones
// Esto es necesario ya que Recepcion depende de Usuario para su clave foránea
Usuario.sync();

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
            model: Usuario,
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

// Establecemos una relación uno a uno con Usuario
// - belongsTo indica que cada recepcionista está asociado a un único usuario
// - La clave foránea 'id_usuario' vincula cada recepción con su usuario correspondiente
// - 'as: usuario' nos permite acceder al usuario relacionado a través de recepcion.usuario
// - CASCADE asegura que si se elimina/actualiza un usuario, su registro de recepción también se elimina/actualiza
Paciente.belongsTo(Usuario, {
    foreignKey: 'id_usuario',
    as: 'usuario',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});


// Creamos un índice único en id_usuario para garantizar que:
// - Cada usuario solo puede tener un rol de recepcionista
// - Mejora el rendimiento en las búsquedas por id_usuario
Paciente.addIndex(['id_usuario'], {
    unique: true,
    name: 'unique_id_usuario'
});

module.exports = Paciente;