module.exports = (sequelize, DataTypes) => {
    const CartItem = sequelize.define("CartItem", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        cartId: { type: DataTypes.INTEGER, allowNull: false }, // tham chiếu Cart
        productId: { type: DataTypes.INTEGER, allowNull: false }, // từ product-service
        size: { type: DataTypes.STRING, allowNull: false }, // ví dụ S, M, L
        quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    }, {
        tableName: "cart_items",
        timestamps: true,
    });

    return CartItem;
};
