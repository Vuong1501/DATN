import express from "express";
import { connectMySQL } from "../config/db.js";
import { getRedis } from "../../common/redis/redis.js";
import { getChannel } from "../../common/rabbitmq/rabbitmq.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const db = await connectMySQL();
        await db.query("SELECT 1");
        await getRedis().set("health", "ok");
        await getChannel().assertQueue("test_queue");

        res.json({ mysql: "ok", redis: "ok", rabbitmq: "ok" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
