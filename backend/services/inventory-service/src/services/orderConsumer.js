import { getChannel } from "../../common/rabbitmq/rabbitmq.js";
import { getRedis } from "../../common/redis/redis.js";
import Inventory from "../models/inventory.model.js";

const EXCHANGE = "inventory_exchange";
const QUEUE = "inventory_decrease_queue";
const RETRY_QUEUE = "inventory_decrease_retry";
const DLQ_QUEUE = "inventory_decrease_dead";
const RETRY_DELAY = 3000;

// hàm retry
const handleRetry = async (channel, msg, data) => {
    const retries = msg.properties.headers?.retries || 0;

    if (retries < 3) {
        await channel.sendToQueue(
            RETRY_QUEUE,
            Buffer.from(JSON.stringify(data)),
            { headers: { retries: retries + 1 }, persistent: true }
        );
        console.log(`Retry #${retries + 1} for event ${data.event}`);
    } else {
        await channel.sendToQueue(DLQ_QUEUE, Buffer.from(JSON.stringify(data)), {
            persistent: true,
        });
        console.log(`Move to DLQ after 3 retries: ${data.event}`);
    }

    channel.ack(msg);
};

const consumeInventoryDecrease = async () => {
    const channel = getChannel();
    const redis = getRedis();

    //Tạo EXCHANGE
    await channel.assertExchange(EXCHANGE, "topic", { durable: true });

    //Queue chính
    await channel.assertQueue(QUEUE, { durable: true });
    await channel.bindQueue(QUEUE, EXCHANGE, "order.created");

    //Retry quêu
    await channel.assertQueue(RETRY_QUEUE, {
        durable: true,
        messageTtl: RETRY_DELAY,
        deadLetterExchange: EXCHANGE,
        deadLetterRoutingKey: "order.created"
    });

    // DLQ
    await channel.assertQueue(DLQ_QUEUE, { durable: true });

    channel.consume(QUEUE, async (msg) => {
        if (!msg) return;
        const data = JSON.parse(msg.content.toString());
        const { orderId, userId, items } = data;
        console.log("Received order.created:", orderId);

        // mảng lưu những thay đổi của redis, phòng khi redis giảm, db không giảm gây lệch dữ liệu
        let undone = [];
        try {
            // tạo 1 cờ để đánh dấu, tránh trường hợp xử lí lỗi mà trừ stock nhiều lần(idempotency key)
            const processedKey = `inventory:order_processed:${orderId}`;
            const alreadyProcessed = await redis.get(processedKey);
            if (alreadyProcessed) {
                console.log(`Order #${orderId} đã xử lý trước đó, bỏ qua`);
                return channel.ack(msg);
            }
            //Giảm redis
            for (const item of items) {
                const stockKey = `inventory:productSize:${item.productSizeId}`;
                const currentStock = await redis.get(stockKey);


                if (currentStock === null) {
                    throw new Error(`Không tìm thấy tồn kho của sizeId=${item.productSizeId}`);
                };

                if (Number(currentStock) < item.quantity) {
                    throw new Error(`Hết hàng Redis, size=${item.productSizeId}`);
                }

                // giảm tồn kho(giảm atomic)
                await redis.decrBy(stockKey, item.quantity);
                undone.push({ stockKey, qty: item.quantity });
            };
            // Giả lập lỗi DB
            // throw new Error("demo lỗi giảm redis nhưng không giảm db");

            //giảm tồn kho trong db
            for (const item of items) {
                await Inventory.decrement(
                    { stock: item.quantity },
                    {
                        where: {
                            productSizeId: item.productSizeId
                        }
                    }
                );
                console.log(
                    `DB decreased: size=${item.productSizeId}, qty=${item.quantity}`
                );
            };
            await redis.set(processedKey, 1, { EX: 3600 }); // lưu 1h, tránh trừ trùng 
            // publish sự kiện trừ tồn kho thành công sang lại bên order-service
            channel.publish(EXCHANGE, "stock.decreased", Buffer.from(JSON.stringify({ orderId, userId, items })));
            console.log(`Inventory decreased for order ${orderId}`);
            channel.ack(msg);
        } catch (error) {
            console.error("Error processing order.created:", error);
            //rollback nếu redis đã trừ rồi
            if (typeof undone !== "undefined") {
                for (const u of undone) {
                    await redis.incrBy(u.stockKey, u.qty);
                    console.log(`Redis rollback: ${u.stockKey} +${u.qty}`);
                }
            }

            //publish sự kiện trừ không thành công sang bên order
            channel.publish(EXCHANGE, "stock.failed", Buffer.from(JSON.stringify({
                orderId,
                reason: error.message
            })))
            await handleRetry(channel, msg, data);
        };
    });
};

export { consumeInventoryDecrease };