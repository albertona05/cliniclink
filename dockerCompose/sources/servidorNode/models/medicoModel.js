const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Medico = sequelize.define('Medico', {
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
    especialidad: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    
}, {
    timestamps: false,
    tableName: 'Medico'
},{
    indexes: [{
        unique: true,
        fields: ['id_usuario']
    }]
});

module.exports = Medico;