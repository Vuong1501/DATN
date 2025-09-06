import amqp from "amqplib";

let channel;

export async function connectRabbitMQ(url, retries = 5, delay = 3000) {
    for (let i = 0; i < retries; i++) {
        try {
            const connection = await amqp.connect(url);
            channel = await connection.createChannel();
            await channel.assertQueue("test_queue");
            console.log("✅ Connected to RabbitMQ");
            return channel;
        } catch (err) {
            console.log(`⚠️ Failed to connect RabbitMQ. Attempt ${i + 1}/${retries}`);
            if (i === retries - 1) throw err; // hết số lần retry → ném lỗi
            await new Promise(res => setTimeout(res, delay)); // đợi vài giây rồi thử lại
        }
    }
}

export function getChannel() {
    if (!channel) throw new Error("RabbitMQ not initialized");
    return channel;
}
