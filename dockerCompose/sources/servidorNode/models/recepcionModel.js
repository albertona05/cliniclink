const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Usuario = require('./usuarioModel');

// Sincronizamos la tabla Usuario para asegurar que exista antes de establecer relaciones
// Esto es necesario ya que Recepcion depende de Usuario para su clave foránea
Usuario.sync();

const Recepcion = sequelize.define('Recepcion', {
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
}, {
    timestamps: false,
    tableName: 'Recepcion',
});

// Establecemos una relación uno a uno con Usuario
// - belongsTo indica que cada recepcionista está asociado a un único usuario
// - La clave foránea 'id_usuario' vincula cada recepción con su usuario correspondiente
// - 'as: usuario' nos permite acceder al usuario relacionado a través de recepcion.usuario
// - CASCADE asegura que si se elimina/actualiza un usuario, su registro de recepción también se elimina/actualiza
Recepcion.belongsTo(Usuario, {
    foreignKey: 'id_usuario',
    as: 'usuario',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
});

// Creamos un índice único en id_usuario para garantizar que:
// - Cada usuario solo puede tener un rol de recepcionista
// - Mejora el rendimiento en las búsquedas por id_usuario
Recepcion.addIndex(['id_usuario'], {
    unique: true,
    name: 'unique_id_usuario'
});

module.exports = Recepcion;