module.exports = (sequelize, DataTypes) => {
    const Usuario = sequelize.define('Usuario', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        nombre: { type: DataTypes.STRING(100), allowNull: false },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: { isEmail: { msg: 'Email inválido' } }
        },
        contrasena: { type: DataTypes.STRING(255), allowNull: false },
        rol: {
            type: DataTypes.ENUM('paciente', 'medico', 'recepcion'),
            allowNull: false,
            defaultValue: 'paciente'
        },
    }, {
        tableName: 'Usuario',
        timestamps: false
    });

    return Usuario;
};
