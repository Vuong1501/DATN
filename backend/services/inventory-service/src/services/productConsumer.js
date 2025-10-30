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
    // const { productId, sizes } = data;
    // const redis = getRedis();

    // // Lấy danh sách inventory hiện tại của sản phẩm
    // const existingInventories = await Inventory.findAll({
    //     where: { productId }
    // });

    // const existingSizeIds = existingInventories.map(i => i.productSizeId);
    // const newSizeIds = sizes.map(s => s.id);

    // // 1️⃣ Thêm size mới
    // for (const s of sizes) {
    //     if (!existingSizeIds.includes(s.id)) {
    //         await Inventory.create({ productId, productSizeId: s.id, stock: 0 });
    //         await redis.set(`inventory:productSize:${s.id}`, 0);
    //         console.log(`🆕 Added inventory for size ${s.id}`);
    //     }
    // }

    // // 2️⃣ Xóa size cũ không còn trong danh sách mới
    // for (const inv of existingInventories) {
    //     if (!newSizeIds.includes(inv.productSizeId)) {
    //         await inv.destroy();
    //         await redis.del(`inventory:productSize:${inv.productSizeId}`);
    //         console.log(`🗑 Removed inventory for size ${inv.productSizeId}`);
    //     }
    // }

    // console.log(`🔄 Updated inventory records for product ${productId}`);
};

const handleProductDeleted = async (data) => {
    // const { productId, sizes } = data;
    // const redis = getRedis();

    // await Inventory.destroy({ where: { productId } });

    // for (const sizeId of sizes) {
    //     await redis.del(`inventory:productSize:${sizeId}`);
    // }

    // console.log(`❌ Deleted inventory records for product ${productId}`);
};

export { consumeProductEvent, handleProductCreated, handleProductUpdated, handleProductDeleted };