const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Import model
const Product = require("./product")(sequelize, DataTypes);
const ProductImage = require("./productImage")(sequelize, DataTypes);

Product.hasMany(ProductImage, { foreignKey: "productId", as: "images" });
ProductImage.belongsTo(Product, { foreignKey: "productId", as: "product" });

Product.hasMany(ProductSize, { foreignKey: "productId", as: "sizes" });
ProductSize.belongsTo(Product, { foreignKey: "productId", as: "product" });

module.exports = { sequelize, Product, ProductImage, ProductSize };

// {
//   name: "Men T-shirt",
//   description: "Cotton T-shirt",
//   price: 200,
//   category: "Men",
//   subCategory: "Topwear",
//   bestSeller: true,
//   date: Date.now(),
//   images: [
//     { url: "link1" },
//     { url: "link2" }
//   ],
//   sizes: [
//     { size: "M", stock: 20 },
//     { size: "L", stock: 15 },
//     { size: "XL", stock: 5 }
//   ]
// }
