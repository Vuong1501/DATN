
module.exports = (sequelize, DataTypes) => {
    const Product = sequelize.define("Product", {
        name: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.STRING, allowNull: false },
        price: { type: DataTypes.FLOAT, allowNull: false },
        category: { type: DataTypes.STRING, allowNull: false },
        subCategory: { type: DataTypes.STRING, allowNull: false },
        bestSeller: { type: DataTypes.BOOLEAN },
        date: { type: DataTypes.FLOAT, allowNull: false },
    }, {
        tableName: "products",
        timestamps: true,
    });

    return Product;
};

