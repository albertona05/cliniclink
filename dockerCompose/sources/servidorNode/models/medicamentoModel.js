module.exports = (sequelize, DataTypes) => {
    const Medicamento = sequelize.define('Medicamento', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        nombre: { type: DataTypes.STRING(100), allowNull: false },
        descripcion: { type: DataTypes.TEXT, allowNull: true }
    }, {
        tableName: 'Medicamento',
        timestamps: false
    });

    return Medicamento;
};