import express from "express";
import { connectRedis } from "../common/redis/redis.js";
import { connectRabbitMQ } from "../common/rabbitmq/rabbitmq.js";

import { startConsumer } from "./consumers/notification.consumer.js";

const app = express();
const {
    REDIS_URL,
    RABBITMQ_URL,
    PORT,
} = process.env;

app.get("/", (req, res) => res.send("Notification Service Running..."));

async function startServer() {
    try {
        await connectRedis(REDIS_URL);
        await connectRabbitMQ(RABBITMQ_URL);
        await startConsumer();


        app.listen(PORT, () => {
            console.log(`notification service running on port ${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start service:", err);
        process.exit(1);
    }
}

startServer();