module.exports = (sequelize, DataTypes) => {
    const Paciente = sequelize.define('Paciente', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        id_usuario: {
            type: DataTypes.BIGINT,
            allowNull: false
        },
        dni: {
            type: DataTypes.STRING(9),
            allowNull: false,
            unique: true,
            validate: { is: [/^\d{8}[A-Za-z]$/] }
        },
        telefono: {
            type: DataTypes.STRING(15),
            allowNull: false,
            validate: { isNumeric: true, len: [9] }
        },
        fechaNacimiento: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            validate: { isDate: true }
        },
        direccion: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: { len: [5, 255] }
        },
    }, {
        tableName: 'Paciente',
        timestamps: false
    });


    return Paciente;
};