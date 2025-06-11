module.exports = (sequelize, DataTypes) => {
    const RecetaMedica = sequelize.define('RecetaMedica', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        id_cita: { type: DataTypes.BIGINT, allowNull: false },
        id_medico: { type: DataTypes.BIGINT, allowNull: false },
        id_paciente: { type: DataTypes.BIGINT, allowNull: false },
        descripcion: { type: DataTypes.TEXT, allowNull: false },
        fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        ruta: { type: DataTypes.STRING(255), allowNull: true }
    }, {
        tableName: 'RecetaMedica',
        timestamps: false
    });


    return RecetaMedica;
};
