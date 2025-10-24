import { getChannel } from "../../common/rabbitmq/rabbitmq.js";
import dotenv from "dotenv";
import { sendMail } from "../email/emailService.js";

dotenv.config();

const EXCHANGE = "notification_exchange";
const QUEUE = "notification_queue";

export const startConsumer = async () => {
    try {
        const channel = getChannel();
        // Tạo exchange kiểu direct
        await channel.assertExchange(EXCHANGE, "direct", { durable: true });

        await channel.assertQueue(QUEUE, { durable: true });

        // Gắn queue với từng routing key
        await channel.bindQueue(QUEUE, EXCHANGE, "forgot_password");
        await channel.bindQueue(QUEUE, EXCHANGE, "order_success");
        console.log("📩 [Notification] Listening on queue:", QUEUE);

        channel.consume(QUEUE, async (msg) => {
            if (!msg) return;
            const content = JSON.parse(msg.content.toString());
            console.log("📨 [Notification] Received message:", content);

            try {
                switch (content.type) {
                    case "forgot_password":
                    case "order_success":
                        await sendMail(content.to, content.subject, content.html);
                        break;
                    default:
                        console.warn("Unknown mail type:", content.type);
                }

                channel.ack(msg);
            } catch (err) {
                console.error("Error sending email:", err);
                channel.nack(msg, false, true);
            }
        });
    } catch (err) {
        console.error("RabbitMQ connection error:", err);
    }
};
