module.exports = (sequelize, DataTypes) => {
    const Cart = sequelize.define("Cart", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        userId: { type: DataTypes.INTEGER, allowNull: false }, // lấy từ user-service
    }, {
        tableName: "carts",
        timestamps: true,
    });

    return Cart;
};
