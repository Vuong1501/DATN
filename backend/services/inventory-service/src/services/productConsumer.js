import { getChannel } from "../../common/rabbitmq/rabbitmq.js";
import { getRedis } from "../../common/redis/redis.js";
import Inventory from "../models/inventory.model.js";

const consumeProductEvent = async () => {
    const channel = getChannel();
    const exchange = "product_exchange";
    const queue = "inventory_product_event";

    await channel.assertExchange(exchange, "topic", { durable: true });
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, exchange, "product.*");
    console.log("👂 Inventory-service listening for product.* events...");

    channel.consume(queue, async (msg) => {
        if (!msg) return;
        const data = JSON.parse(msg.content.toString());
        const event = msg.fields.routingKey;

        try {
            switch (event) {
                case "product.created":
                    await handleProductCreated(data);
                    break;
                case "product.updated":
                    await handleProductUpdated(data);
                    break;
                case "product.deleted":
                    await handleProductDeleted(data);
                    break;
                default:
                    console.log("⚠️ Unknown event:", event);
            }

            channel.ack(msg);
        } catch (err) {
            console.error("Error handling event:", err);
            channel.nack(msg, false, true);
        }
    });
};

const handleProductCreated = async (data) => {
    const { productId, sizes } = data;
    const redis = getRedis();
    for (const s of sizes) {
        await Inventory.create({ productSizeId: s.id, stock: 0 });

        const redisKey = `inventory:productSize:${s.id}`;
        await redis.set(redisKey, 0);
    };
    console.log(`✅ Created inventory records for product ${productId}`);
};

const handleProductUpdated = async (data) => {

};

const handleProductDeleted = async (data) => {

};

export { consumeProductEvent, handleProductCreated, handleProductUpdated, handleProductDeleted };