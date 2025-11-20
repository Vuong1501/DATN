import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

import Order from "./order.model.js";
import OrderDetail from "./orderDetail.model.js";

Order.hasMany(OrderDetail, { foreignKey: "orderId", as: "orderDetails" });
OrderDetail.belongsTo(Order, { foreignKey: "orderId", as: "order" });

export { sequelize, Order, OrderDetail };