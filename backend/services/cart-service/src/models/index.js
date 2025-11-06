import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

import Cart from "./cart.model.js";
import CartItem from "./cartItem.model.js";

Cart.hasMany(CartItem, { foreignKey: "cartId", as: "items" });
CartItem.belongsTo(Cart, { foreignKey: "cartId", as: "cart" });

export { sequelize, Cart, CartItem };
