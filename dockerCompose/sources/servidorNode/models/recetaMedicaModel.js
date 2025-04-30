module.exports = (sequelize, DataTypes) => {
    const RecetaMedica = sequelize.define('RecetaMedica', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        id_cita: { type: DataTypes.BIGINT, allowNull: false },
        id_medico: { type: DataTypes.BIGINT, allowNull: false },
        id_paciente: { type: DataTypes.BIGINT, allowNull: false },
        descripcion: { type: DataTypes.TEXT, allowNull: false },
        fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
    }, {
        tableName: 'RecetaMedica',
        timestamps: false
    });

    RecetaMedica.associate = (models) => {
        RecetaMedica.belongsTo(models.Cita, { foreignKey: 'id_cita', as: 'cita' });
        RecetaMedica.belongsTo(models.Medico, { foreignKey: 'id_medico', as: 'medico' });
        RecetaMedica.belongsTo(models.Paciente, { foreignKey: 'id_paciente', as: 'paciente' });
    };

    return RecetaMedica;
};
