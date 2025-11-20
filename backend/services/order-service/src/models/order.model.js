import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Order = sequelize.define("Order", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    // Snapshot
    username: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: false },
    ward: { type: DataTypes.STRING, allowNull: true },
    district: { type: DataTypes.STRING, allowNull: true },
    province: { type: DataTypes.STRING, allowNull: true },

    totalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    status: {
        type: DataTypes.ENUM("pending", "confirmed", "shipping", "completed", "cancelled"),
        defaultValue: "pending"
    },
    note: { type: DataTypes.STRING, allowNull: true }
}, {
    tableName: "orders",
    timestamps: true
});

export default Order;