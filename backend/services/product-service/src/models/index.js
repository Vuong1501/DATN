import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

// Import model
import Product from "./product.model.js";
import ProductImage from "./productImage.model.js";
import ProductSize from "./productSize.model.js";

Product.hasMany(ProductImage, { foreignKey: "productId", as: "images" });
ProductImage.belongsTo(Product, { foreignKey: "productId", as: "product" });

Product.hasMany(ProductSize, { foreignKey: "productId", as: "sizes" });
ProductSize.belongsTo(Product, { foreignKey: "productId", as: "product" });

export { sequelize, Product, ProductImage, ProductSize };

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

// Dữ liệu mới sau update model product
// {
//   "id": 1,
//   "name": "Áo thun nam",
//   "description": "Áo thun cotton 100%",
//   "price": 199000,
//   "category": {
//     "id": 2,
//     "name": "Thời trang nam"
//   },
//   "images": [
//     { "id": 101, "url": "https://cdn.shop/1.png" },
//     { "id": 102, "url": "https://cdn.shop/2.png" }
//   ],
//   "sizes": [
//     { "id": 10, "size": "M", "stock": 20 },
//     { "id": 11, "size": "L", "stock": 15 }
//   ]
// }
