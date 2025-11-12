import { getChannel } from "../../common/rabbitmq/rabbitmq.js";
import { getRedis } from "../../common/redis/redis.js";
import Inventory from "../models/inventory.model.js";
import { Op } from "sequelize";


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
                case "product.cacheUpdated":
                    await handleProductCacheUpdated(data);
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
                        case "product.cacheUpdated":
                            await handleProductCacheUpdated(data);
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
    const { productId, name, price, sizes } = data;

    const redis = getRedis();
    for (const s of sizes) {
        await Inventory.create({ productSizeId: s.id, stock: 0 });

        const redisKey = `inventory:productSize:${s.id}`;
        await redis.set(redisKey, 0);
    };
    console.log(`Created inventory records for product ${productId}`);

    const redisKey = `product:info:${productId}`;
    const cacheProduct = {
        id: productId,
        name,
        price,
        sizes: sizes.map(s => ({
            id: s.id,
            size: s.size
        }))
    };
    await redis.set(redisKey, JSON.stringify(cacheProduct));
    console.log("cache trong redis>>>", JSON.stringify(cacheProduct, null, 2));


};

const handleProductUpdated = async (data) => {

    const { productId, price, name, deletedSizeIds, addedSizes, keptSizes } = data;

    const redis = getRedis();

    // XÓA INVENTORY CỦA SIZE ĐÃ BỊ XÓA
    if (deletedSizeIds && deletedSizeIds.length > 0) {
        const oldInventories = await Inventory.findAll({
            where: { productSizeId: { [Op.in]: deletedSizeIds } },
            attributes: ["id", "productSizeId"],
        });

        for (const inv of oldInventories) {
            await inv.destroy();
            await redis.del(`inventory:productSize:${inv.productSizeId}`);
            console.log(` Đã xóa inventory & cache cho sizeId ${inv.productSizeId}`);
        }
    }

    // THÊM INVENTORY MỚI CHO SIZE MỚI
    if (addedSizes && addedSizes.length > 0) {
        for (const size of addedSizes) {
            const newInv = await Inventory.create({
                productSizeId: size.id,
                stock: 0,
            });
            await redis.set(`inventory:productSize:${size.id}`, 0);
            console.log(`Tạo inventory mới cho size ${size.size} (id=${size.id})`);
        }
    }
    // CẬP NHẬT CACHE REDIS CHO PRODUCT
    const redisProductKey = `product:info:${productId}`;
    const allSizes = [...(addedSizes || []), ...(keptSizes || [])];
    await redis.set(redisProductKey, JSON.stringify({
        id: productId,
        name,
        price,
        sizes: allSizes.map(s => ({
            id: s.id,
            size: s.size
        }))
    }));
    const cacheValue = await redis.get(redisProductKey);
    console.log("cache trong redis>>>", JSON.stringify(JSON.parse(cacheValue), null, 2));
};

const handleProductDeleted = async (data) => {
    const { productId, sizeIds } = data;

    const redis = getRedis();
    // tìm và xóa size cũ
    const oldInventories = await Inventory.findAll({
        where: {
            productSizeId: {
                [Op.in]: sizeIds
            }
        },
        attributes: ["id", "productSizeId"],
    });
    for (const inv of oldInventories) {
        await inv.destroy();
        await redis.del(`inventory:productSize:${inv.productSizeId}`);
        console.log(`Removed old inventory & cache for size ${inv.productSizeId}`);
    };
    console.log(` Deleted inventory records for productSizeId `);

    await redis.del(`product:info:${productId}`)
};

const handleProductCacheUpdated = async (data) => {
    const { productId, name, price, sizes } = data;
    const redis = getRedis();
    const redisKey = `product:info:${productId}`;

    // Cập nhật cache thông tin sản phẩm
    await redis.set(redisKey, JSON.stringify(
        {
            productId,
            name,
            price,
            sizes: sizes.map(s => ({
                id: s.id,
                size: s.size
            }))
        }));

    console.log(`Cache updated for product ${productId}`);
};


export { consumeProductEvent, handleProductCreated, handleProductUpdated, handleProductDeleted };