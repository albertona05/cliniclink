module.exports = (sequelize, DataTypes) => {
    const Prueba = sequelize.define('Prueba', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        id_medicoManda: { type: DataTypes.BIGINT, allowNull: false }
    }, {
        tableName: 'Prueba',
        timestamps: false
    });

    Prueba.associate = (models) => {
        Prueba.belongsTo(models.Medico, { foreignKey: 'id_medicoManda', as: 'medico' });
    };

    return Prueba;
};
