// src/config/db.js
import mysql from "mysql2/promise";

let pool;

export const connectMySQL = async () => {
    if (!pool) {
        const config = {
            host: process.env.MYSQL_HOST,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DB,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        };

        let retries = 10;
        while (retries) {
            try {
                pool = mysql.createPool(config);
                await pool.query("SELECT 1");
                console.log("✅ Connected to MySQL");
                break;
            } catch (err) {
                retries -= 1;
                console.log(
                    `❌ MySQL connection failed. Retrying... (${retries} left)`
                );
                await new Promise((res) => setTimeout(res, 3000)); // đợi 3s
            }
        }

        if (!pool) throw new Error("Failed to connect to MySQL after retries");
    }
    return pool;
};
