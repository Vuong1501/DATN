import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import sequelize from "./config/db.js";
import { connectRedis } from "../common/redis/redis.js";
import { connectRabbitMQ } from "../common/rabbitmq/rabbitmq.js";
import { consumeProductEvent } from "./services/productConsumer.js";
import { consumeInventoryDecrease } from "./services/orderConsumer.js";
import inventoryRouter from "./routes/inventory.route.js";

const app = express();

const {
    REDIS_URL,
    RABBITMQ_URL,
    PORT,
} = process.env; // lấy từ docker-compose

// middleware
app.use(express.json());
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true
}));
app.use(cookieParser());

app.use("/inventory", inventoryRouter);

async function startServer() {
    try {
        // await connectWithRetry(); nếu connect mysql lỗi thì dùng
        await sequelize.authenticate();
        const isDev = process.env.NODE_ENV !== "production"; // check môi trường
        await sequelize.sync({ alter: isDev });
        await connectRedis(REDIS_URL);
        await connectRabbitMQ(RABBITMQ_URL);
        await consumeProductEvent();
        await consumeInventoryDecrease();

        console.log("NODE_ENV =", process.env.NODE_ENV);


        app.listen(PORT, () => {
            console.log(`Product service running on port ${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start service:", err);
        process.exit(1);
    }
}

startServer();