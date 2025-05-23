module.exports = (sequelize, DataTypes) => {
    const Cita = sequelize.define('Cita', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        id_paciente: { type: DataTypes.BIGINT, allowNull: false },
        id_medico: { type: DataTypes.BIGINT, allowNull: true },
        fecha: { type: DataTypes.DATE, allowNull: false },
        hora: { type: DataTypes.TIME, allowNull: false },
        estado: {
            type: DataTypes.ENUM('espera', 'cancelado', 'finalizado'),
            allowNull: false,
            defaultValue: 'espera'
        },
        info: { type: DataTypes.STRING(100), allowNull: true },
        id_prueba: { type: DataTypes.BIGINT, allowNull: true },
        es_prueba: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        tipo_prueba: { type: DataTypes.STRING(100), allowNull: true }
    }, {
        tableName: 'Cita',
        timestamps: false
    });

    Cita.associate = (models) => {
        Cita.belongsTo(models.Paciente, { foreignKey: 'id_paciente', as: 'paciente' });
        Cita.belongsTo(models.Medico, { foreignKey: 'id_medico', as: 'medico' });
        Cita.hasMany(models.RecetaMedica, { foreignKey: 'id_cita', as: 'recetas' });
        Cita.belongsTo(models.Prueba, { foreignKey: 'id_prueba', as: 'prueba' });
    };

    return Cita;
};
