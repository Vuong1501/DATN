import { Order, OrderDetail, sequelize } from "../models/index.js";
import { getRedis } from "../../common/redis/redis.js";
import { getChannel } from "../../common/rabbitmq/rabbitmq.js";

const EXCHANGE = "inventory_exchange";
const ORDER_QUEUE = "order_status_update_queue";

const consumeOrderStatus = async () => {
    const channel = getChannel();

    await channel.assertExchange(EXCHANGE, "topic", { durable: true });
    await channel.assertQueue(ORDER_QUEUE, { durable: true });

    // nghe stock.decreased và stock.failed
    await channel.bindQueue(ORDER_QUEUE, EXCHANGE, "stock.decreased");
    await channel.bindQueue(ORDER_QUEUE, EXCHANGE, "stock.failed");

    channel.consume(ORDER_QUEUE, async (msg) => {
        const data = JSON.parse(msg.content.toString());
        console.log("dataa", data);

        const event = msg.fields.routingKey;

        try {
            if (event === 'stock.decreased') {
                await Order.update(
                    { status: "confirmed" },
                    { where: { id: data.orderId } }
                );
                const channel = getChannel();
                channel.publish(
                    "notification_exchange",
                    "order_success",
                    Buffer.from(JSON.stringify({
                        type: "order_success",
                        orderId: data.orderId,
                        orderDetail: data.items,
                        userId: data.userId

                    })),
                    { persistent: true }
                )
            } else if (event === "stock.failed") {
                await Order.update(
                    { status: "cancelled" },
                    { where: { id: data.orderId } }
                );
            };
            channel.ack(msg);
        } catch (error) {
            console.error("Order status update error:", error);
            channel.nack(msg, false, true); // retry message
        }
    })
};

export { consumeOrderStatus };