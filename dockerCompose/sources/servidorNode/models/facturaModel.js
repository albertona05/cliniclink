module.exports = (sequelize, DataTypes) => {
    const Factura = sequelize.define('Factura', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        id_paciente: { type: DataTypes.BIGINT, allowNull: false },
        monto: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                isDecimal: true,
                min: 0.01
            }
        },
        estado: {
            type: DataTypes.ENUM('en espera', 'cobrado'),
            allowNull: false,
            defaultValue: 'en espera'
        },
        fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        ruta: { type: DataTypes.STRING(255), allowNull: true }
    }, {
        tableName: 'Factura',
        timestamps: false
    });


    return Factura;
};
