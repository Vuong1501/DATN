import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Inventory = sequelize.define("Inventory", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    productSizeId: { type: DataTypes.INTEGER, allowNull: false },
    stock: { type: DataTypes.INTEGER, allowNull: false }
}, {
    tableName: "inventory",
    timestamps: true
});

export default Inventory;