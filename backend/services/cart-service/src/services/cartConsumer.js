import { getChannel } from "../../common/rabbitmq/rabbitmq.js";
import { Cart, CartItem } from "../models/index.js";
import { Op } from "sequelize";

const EXCHANGE = "product_exchange";
const QUEUE = "cart_product_event";
const RETRY_QUEUE = "cart_product_event_retry";
const DLQ_QUEUE = "cart_product_event_dead";
const RETRY_DELAY = 3000; // 3 giây

// Hàm retry
const handleRetry = async (channel, msg, data) => {
    const retries = msg.properties.headers?.retries || 0;

    if (retries < 3) {
        await channel.sendToQueue(RETRY_QUEUE, Buffer.from(JSON.stringify(data)), {
            headers: { retries: retries + 1 },
            persistent: true,
        });
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
    await channel.bindQueue(QUEUE, EXCHANGE, "product.deleted");
    await channel.bindQueue(QUEUE, EXCHANGE, "product.updated");

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

        const event = msg.fields.routingKey;
        const data = JSON.parse(msg.content.toString());
        if (!data.event) data.event = event;

        try {
            if (event === "product.deleted") {
                await handleProductDeleted(data);
            } else if (event === "product.updated" && data.deletedSizeIds?.length) {
                await handleProductUpdated(data);
            }

            channel.ack(msg);
        } catch (err) {
            console.error("Cart Error handling event:", err);
            await handleRetry(channel, msg, data);
        }
    });
};

// Khi product bị xóa → đánh cờ tất cả cart items
const handleProductDeleted = async (data) => {
    const { productId } = data;
    await CartItem.update(
        {
            isDeleted: true,
        },
        { where: { productId } }
    );
    console.log(`[Cart] Product ${productId} đã bị xóa. CartItem cập nhật.`);
};

const handleProductUpdated = async (data) => {
    const { deletedSizeIds } = data;
    await CartItem.update(
        {
            isDeleted: true,
        },
        {
            where: { productSizeId: { [Op.in]: deletedSizeIds } },
        }
    );
    console.log(`[Cart] Các sizeId bị xóa: ${deletedSizeIds.join(", ")}. CartItem cập nhật.`);
};

export { consumeProductEvent };