module.exports = (sequelize, DataTypes) => {
    const Medico = sequelize.define('Medico', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        id_usuario: { type: DataTypes.BIGINT, allowNull: false },
        especialidad: { type: DataTypes.STRING(100), allowNull: false },
    }, {
        tableName: 'Medico',
        timestamps: false
    });

    Medico.associate = (models) => {
        Medico.belongsTo(models.Usuario, { foreignKey: 'id_usuario', as: 'usuario' });
        Medico.hasMany(models.Cita, { foreignKey: 'id_medico', as: 'citas' });
        Medico.hasMany(models.RecetaMedica, { foreignKey: 'id_medico', as: 'recetas' });
        Medico.hasMany(models.Prueba, { foreignKey: 'id_medicoManda', as: 'pruebas' });
    };

    return Medico;
};
