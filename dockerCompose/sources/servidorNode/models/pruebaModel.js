const { Sequelize, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const Prueba = sequelize.define('Prueba', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        id_medicoManda: { type: DataTypes.BIGINT, allowNull: false },
        id_medicoAsignado: { type: DataTypes.BIGINT, allowNull: true },
        id_cita: { type: DataTypes.BIGINT, allowNull: true },
        tipo_prueba: { type: DataTypes.STRING(100), allowNull: false },
        descripcion: { type: DataTypes.TEXT, allowNull: true },
        estado: { 
            type: DataTypes.ENUM('pendiente', 'en_proceso', 'finalizado'), 
            allowNull: false,
            defaultValue: 'pendiente'
        },
        resultado: { type: DataTypes.TEXT, allowNull: true },
        fecha_creacion: { type: DataTypes.DATE, allowNull: true, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        fecha_realizacion: { type: DataTypes.DATE, allowNull: true }
    }, {
        tableName: 'Prueba',
        timestamps: false
    });

    Prueba.associate = (models) => {
        Prueba.belongsTo(models.Medico, { foreignKey: 'id_medicoManda', as: 'medicoManda' });
        Prueba.belongsTo(models.Medico, { foreignKey: 'id_medicoAsignado', as: 'medicoAsignado' });
        Prueba.belongsTo(models.Cita, { foreignKey: 'id_cita', as: 'cita' });
    };

    return Prueba;
};
