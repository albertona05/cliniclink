const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
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
                model: 'Usuario',  // Relacionado con la tabla 'Usuario'
                key: 'id'
            }
        },
    }, {
        tableName: 'Recepcion',
        timestamps: false
    });

    return Recepcion;
};
