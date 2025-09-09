const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Cart = require("./cart")(sequelize, DataTypes);
const CartItem = require("./cartItem")(sequelize, DataTypes);

Cart.hasMany(CartItem, { foreignKey: "cartId", as: "items" });
CartItem.belongsTo(Cart, { foreignKey: "cartId", as: "cart" });

module.exports = { sequelize, Cart, CartItem };
