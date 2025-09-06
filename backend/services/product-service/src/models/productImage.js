
module.exports = (sequelize, DataTypes) => {
    const ProductImage = sequelize.define("ProductImage", {
        url: { type: DataTypes.STRING, allowNull: false },
    }, {
        tableName: "product_images", // để số nhiều cho chuẩn
        timestamps: true,
    });

    return ProductImage;
};
