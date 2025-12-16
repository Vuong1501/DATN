import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const FlashSale = sequelize.define("FlashSale", {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
    productId: { type: DataTypes.BIGINT, allowNull: false },
    productSizeId: { type: DataTypes.BIGINT, allowNull: false },
    flashPrice: { type: DataTypes.INTEGER, allowNull: false },
    flashStock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    sold: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    startTime: { type: DataTypes.BIGINT, allowNull: false },
    endTime: { type: DataTypes.BIGINT, allowNull: false },
    isPreloaded: { type: DataTypes.BOOLEAN, defaultValue: false },
    limitPerUser: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 }
}, {
    tableName: "flash_sale",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
});

export default FlashSale;