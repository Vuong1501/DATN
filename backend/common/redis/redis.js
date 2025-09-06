import { createClient } from "redis";

let redisClient;

export async function connectRedis(url) {
    redisClient = createClient({ url });
    redisClient.on("error", (err) => console.error("Redis error", err));
    await redisClient.connect();
    console.log("✅ Connected to Redis");
    return redisClient;
}

export function getRedis() {
    if (!redisClient) throw new Error("Redis not initialized");
    return redisClient;
}
