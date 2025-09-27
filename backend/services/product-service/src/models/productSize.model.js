import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ProductSize = sequelize.define("ProductSize", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    size: { type: DataTypes.STRING, allowNull: false },   // ví dụ: S, M, L, XL
    productId: { type: DataTypes.INTEGER, allowNull: false },
}, {
    tableName: "product_sizes",
    timestamps: true,
});

export default ProductSize;