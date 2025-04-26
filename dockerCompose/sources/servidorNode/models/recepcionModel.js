const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');


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
            model: 'Usuario',
            key: 'id'
        },
    },
}, {
    timestamps: false,
    tableName: 'Recepcion',
});

module.exports = Recepcion;