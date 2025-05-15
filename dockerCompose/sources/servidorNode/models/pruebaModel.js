module.exports = (sequelize, DataTypes) => {
    const Prueba = sequelize.define('Prueba', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        id_medicoManda: { type: DataTypes.BIGINT, allowNull: false },
        id_cita: { type: DataTypes.BIGINT, allowNull: false },
    }, {
        tableName: 'Prueba',
        timestamps: false
    });

    return Prueba;
};
