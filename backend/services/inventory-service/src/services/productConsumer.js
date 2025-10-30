import { getChannel } from "../../common/rabbitmq/rabbitmq.js";
import { getRedis } from "../../common/redis/redis.js";
import Inventory from "../models/inventory.model.js";


const EXCHANGE = "product_exchange";
const QUEUE = "inventory_product_event";
const RETRY_QUEUE = "inventory_product_event_retry";
const DLQ_QUEUE = "inventory_product_event_dead";
const RETRY_DELAY = 3000;

// Hàm retry
const handleRetry = async (channel, msg, data) => {
    const retries = msg.properties.headers?.retries || 0;

    if (retries < 3) {
        await channel.sendToQueue(
            RETRY_QUEUE,
            Buffer.from(JSON.stringify(data)),
            { headers: { retries: retries + 1 }, persistent: true }
        );
        console.log(`🔄 Retry #${retries + 1} for event ${data.event}`);
    } else {
        await channel.sendToQueue(DLQ_QUEUE, Buffer.from(JSON.stringify(data)), {
            persistent: true,
        });
        console.log(`💀 Move to DLQ after 3 retries: ${data.event}`);
    }

    channel.ack(msg);
};

const consumeProductEvent = async () => {
    const channel = getChannel();

    await channel.assertExchange(EXCHANGE, "topic", { durable: true });
    await channel.assertQueue(QUEUE, { durable: true });
    await channel.bindQueue(QUEUE, EXCHANGE, "product.*");

    await channel.assertQueue(RETRY_QUEUE, {
        durable: true,
        messageTtl: RETRY_DELAY,
        deadLetterExchange: EXCHANGE,
        deadLetterRoutingKey: "product.retry", // queue chính nhận lại
    });

    // DLQ
    await channel.assertQueue(DLQ_QUEUE, { durable: true });

    channel.consume(QUEUE, async (msg) => {
        if (!msg) return;
        const data = JSON.parse(msg.content.toString());
        const event = msg.fields.routingKey;
        if (!data.event) {
            data.event = event;
        }

        console.log("📩 Received message:", { event, data });

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
                case "product.retry": // 👈 thêm case này để handle message quay lại từ retry queue
                    console.log("♻️ Retrying event:", data.event);
                    switch (data.event) {
                        case "product.created":
                            await handleProductCreated(data);
                            break;
                        case "product.updated":
                            await handleProductUpdated(data);
                            break;
                        case "product.deleted":
                            await handleProductDeleted(data);
                            break;
                    }
                    break;
                default:
                    console.log("⚠️ Unknown event:", event);
            }

            channel.ack(msg);
        } catch (err) {
            console.error("Error handling event:", err);
            await handleRetry(channel, msg, data);
        }
    });
};

const handleProductCreated = async (data) => {
    // console.log("handleProductCreated running...");
    // throw new Error("Fake error for demo retry!");
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