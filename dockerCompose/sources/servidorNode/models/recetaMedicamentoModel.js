module.exports = (sequelize, DataTypes) => {
    const RecetaMedicamento = sequelize.define('RecetaMedicamento', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        id_receta: { type: DataTypes.BIGINT, allowNull: false },
        id_medicamento: { type: DataTypes.BIGINT, allowNull: false },
        frecuencia: { type: DataTypes.STRING(50), allowNull: false }, // Ej: "Cada 8 horas"
        duracion: { type: DataTypes.STRING(50), allowNull: false }, // Ej: "7 días"
        dosis: { type: DataTypes.STRING(50), allowNull: false }, // Ej: "1 comprimido"
        instrucciones: { type: DataTypes.TEXT, allowNull: true } // Instrucciones adicionales
    }, {
        tableName: 'RecetaMedicamento',
        timestamps: false
    });


    return RecetaMedicamento;
};