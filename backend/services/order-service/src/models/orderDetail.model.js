import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const OrderDetail = sequelize.define("OrderDetail", {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    //snapshot
    productName: { type: DataTypes.STRING, allowNull: false },// tên sản phẩm lúc đặt
    productSizeId: { type: DataTypes.INTEGER, allowNull: false },
    sizeName: { type: DataTypes.STRING, allowNull: false },// tên size lúc đặt
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },// giá tại thời điểm đặt
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false }// quantity * price
}, {
    tableName: "order_detail",
    timestamps: true
});

export default OrderDetail;