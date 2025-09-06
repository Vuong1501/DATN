import express from "express";
import cors from "cors";
import { connectMySQL } from "./config/db.js";
import { connectRedis } from "../common/redis/redis.js";
import { connectRabbitMQ } from "../common/rabbitmq/rabbitmq.js";
import healthRouter from "./routes/health.js";

// App Config
const app = express();
const {
    MYSQL_HOST,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_DB,
    REDIS_URL,
    RABBITMQ_URL,
    PORT = 3001,
} = process.env; // lấy từ docker-compose

// middleware
app.use(express.json());
app.use(cors());

// routes
app.use("/health", healthRouter);

async function startServer() {
    try {
        await connectMySQL({
            host: MYSQL_HOST,
            user: MYSQL_USER,
            password: MYSQL_PASSWORD,
            database: MYSQL_DB,
        });
        await connectRedis(REDIS_URL);
        await connectRabbitMQ(RABBITMQ_URL);

        app.listen(PORT, () => {
            console.log(`User service running on port ${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start service:", err);
        process.exit(1);
    }
}

startServer();
