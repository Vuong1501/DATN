const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Import model
const Product = require("./product")(sequelize, DataTypes);
const ProductImage = require("./productImage")(sequelize, DataTypes);

Product.hasMany(ProductImage, { foreignKey: "productId", as: "images" });
ProductImage.belongsTo(Product, { foreignKey: "productId", as: "product" });

module.exports = { sequelize, Product, ProductImage };