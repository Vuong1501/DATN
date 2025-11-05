module.exports = (sequelize, DataTypes) => {
    const CartItem = sequelize.define("CartItem", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        cartId: { type: DataTypes.INTEGER, allowNull: false },
        productId: { type: DataTypes.INTEGER, allowNull: false },
        productSizeId: { type: DataTypes.INTEGER, allowNull: false },
        quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
        isSelected: { type: DataTypes.BOOLEAN, allowNull: false }
    }, {
        tableName: "cart_items",
        timestamps: true,
    });

    return CartItem;
};
