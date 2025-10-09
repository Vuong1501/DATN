import { getChannel } from "../../common/rabbitmq/rabbitmq.js";
import { getRedis } from "../../common/redis/redis.js";

const consumeCategoryEvent = async () => {
    const channel = getChannel();
    await channel.assertExchange("category_events", "fanout", { durable: false });

    const q = await channel.assertQueue("", { exclusive: true });
    channel.bindQueue(q.queue, "category_events", "");

    channel.consume(q.queue, async (msg) => {
        if (!msg) return;
        const event = JSON.parse(msg.content.toString());
        const redis = getRedis();
        console.log(`📨 Nhận sự kiện: ${event.event}`);
        await redis.del("categories:all"); // xóa cache khi có thay đổi
        console.log("🧹 Category cache invalidated (categories:all removed)");
        channel.ack(msg);
    });
};
export { consumeCategoryEvent };