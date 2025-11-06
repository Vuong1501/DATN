import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Cart = sequelize.define("Cart", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
}, {
    tableName: "carts",
    timestamps: true,
});
export default Cart;
