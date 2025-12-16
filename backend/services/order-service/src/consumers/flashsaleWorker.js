import { getRedis } from "../../common/redis/redis.js";
import { getChannel } from "../../common/rabbitmq/rabbitmq.js";
import { FlashPendingOrder } from "../models/index.js";

const EXCHANGE = "flash_exchange";
const FLASH_QUEUE = "flash_order_queue";

const consumeFlashOrder = async () => {
    const channel = getChannel();


    await channel.assertExchange(EXCHANGE, "topic", { durable: true });
    await channel.assertQueue(FLASH_QUEUE, { durable: true });

    await channel.bindQueue(FLASH_QUEUE, EXCHANGE, "flash.order");

    console.log("Flash order worker is listening...");

    channel.consume(FLASH_QUEUE, async (msg) => {
        const data = JSON.parse(msg.content.toString());
        const { requestId, userId, productId, productSizeId, quantity, price } = data;

        try {
            console.log("⚡ Flash worker nhận job:", data);

            // 1. Lưu vào bảng tạm
            await FlashPendingOrder.create({
                requestId,
                userId,
                productId,
                productSizeId,
                quantity,
                price,
                status: "PENDING"
            });



            // 3. ACK message
            channel.ack(msg);
        } catch (error) {
            console.error("Flash worker error:", error);
            channel.nack(msg, false, true);
        }
    })
};

export { consumeFlashOrder };