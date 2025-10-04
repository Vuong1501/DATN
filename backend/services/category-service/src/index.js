import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import sequelize from "./config/db.js";
import mysql from "mysql2/promise";
import { connectRedis } from "../common/redis/redis.js";
import { connectRabbitMQ } from "../common/rabbitmq/rabbitmq.js";
import categoryRouter from "./routes/category.route.js";

const app = express();

const {
    REDIS_URL,
    RABBITMQ_URL,
    PORT = 3003,
    MYSQL_HOST,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_DB,
} = process.env; // lấy từ docker-compose

// middleware
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(cookieParser());

const initDatabase = async () => {
    const connection = await mysql.createConnection({
        host: MYSQL_HOST,
        user: MYSQL_USER,
        password: MYSQL_PASSWORD,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_DB}\`;`);
    await connection.end();
}

// routes
app.use("/category", categoryRouter);

// nếu connect mysql lỗi thì dùng
// const connectWithRetry = async (retries = 5, delay = 5000) => {
//     while (retries) {
//         try {
//             await sequelize.authenticate();
//             console.log("✅ Database connected");
//             return;
//         } catch (err) {
//             retries -= 1;
//             console.error(
//                 `❌ DB connection failed (${err.message}). Retries left: ${retries}`
//             );
//             if (!retries) throw err;
//             await new Promise((res) => setTimeout(res, delay));
//         }
//     }
// };

const startServer = async () => {
    try {
        await initDatabase();
        // nếu connect mysql lỗi thì dùng
        // await connectWithRetry();
        await sequelize.authenticate();
        const isDev = process.env.NODE_ENV !== "production"; // check môi trường
        await sequelize.sync({ alter: isDev });
        await connectRedis(REDIS_URL);
        await connectRabbitMQ(RABBITMQ_URL);
        console.log("NODE_ENV =", process.env.NODE_ENV);


        app.listen(PORT, () => {
            console.log(`Category service running on port ${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start service:", err);
        process.exit(1);
    }
}

startServer();
