module.exports = (sequelize, DataTypes) => {
    const Medico = sequelize.define('Medico', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        id_usuario: { type: DataTypes.BIGINT, allowNull: false },
        especialidad: { type: DataTypes.STRING(100), allowNull: false },
    }, {
        tableName: 'Medico',
        timestamps: false
    });


    return Medico;
};
