
module.exports = (sequelize, DataTypes) => {
    const ProductImage = sequelize.define("ProductImage", {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        url: { type: DataTypes.STRING, allowNull: false },
    }, {
        tableName: "product_images",
        timestamps: true,
    });

    return ProductImage;
};
