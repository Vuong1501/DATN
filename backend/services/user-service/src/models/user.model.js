// const { DataTypes } = require("sequelize");
// const sequelize = require("../config/database");
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const User = sequelize.define("User", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: true },// chỉ dùng cho local
    provider: {
        type: DataTypes.ENUM("local", "google", "facebook"),
        allowNull: false,
        defaultValue: "local"
    },
    providerId: { type: DataTypes.STRING, allowNull: true },
    role: { type: DataTypes.ENUM("user", "admin"), defaultValue: "user" },
}, {
    tableName: "users",
    timestamps: true,
});

export default User;