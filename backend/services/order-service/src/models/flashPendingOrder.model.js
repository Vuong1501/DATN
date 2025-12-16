import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const FlashPendingOrder = sequelize.define("FlashPendingOrder", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    requestId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    productId: DataTypes.INTEGER,
    productSizeId: DataTypes.INTEGER,
    quantity: DataTypes.INTEGER,
    price: DataTypes.INTEGER,
    status: {
        type: DataTypes.ENUM("PENDING", "CONFIRMED", "FAILED"),
        defaultValue: "PENDING"
    }
}, {
    tableName: "flash_pending_orders",
    timestamps: true
});

export default FlashPendingOrder;