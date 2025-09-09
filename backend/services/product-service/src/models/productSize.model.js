
module.exports = (sequelize, DataTypes) => {
    const ProductSize = sequelize.define("ProductSize", {
        size: { type: DataTypes.STRING, allowNull: false },   // ví dụ: S, M, L, XL
        stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    }, {
        tableName: "product_sizes",
        timestamps: true,
    });
    return ProductSize;
}