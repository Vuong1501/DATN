import { getChannel } from "../../common/rabbitmq/rabbitmq.js";
import dotenv from "dotenv";
import axios from "axios";
import { sendMail } from "../email/emailService.js";

dotenv.config();

const EXCHANGE = "notification_exchange";
const QUEUE = "notification_queue";
const DLX_QUEUE = "notification_queue_dead";
const RETRY_QUEUE = "notification_queue_retry";
const RETRY_DELAY = 3000;

const USER_SERVICE_URL = "http://user-service:3001/users";

const handleRetry = (channel, msg, content) => {

    const retries = msg.properties.headers?.retries || 0;
    const routingKey = content.type;

    if (retries < 3) {
        channel.sendToQueue(
            `${RETRY_QUEUE}_${routingKey}`,
            Buffer.from(JSON.stringify(content)),
            { headers: { retries: retries + 1 }, persistent: true }
        );

        console.log(`🔄 Retry #${retries + 1} for ${content.to} (type: ${routingKey})`);
    } else {
        // Quá 3 lần thì vào DLQ
        channel.sendToQueue(DLX_QUEUE, Buffer.from(JSON.stringify(content)), {
            persistent: true,
        });
        console.log(`💀 Move to DLQ after 3 retries: ${content.to} (type: ${routingKey})`);
    }

    channel.ack(msg);
};

export const startConsumer = async () => {
    try {
        const channel = getChannel();
        // Tạo exchange kiểu direct
        await channel.assertExchange(EXCHANGE, "direct", { durable: true });
        await channel.assertQueue(QUEUE, { durable: true });
        await channel.assertQueue(DLX_QUEUE, { durable: true });

        await channel.assertQueue(`${RETRY_QUEUE}_forgot_password`, {
            durable: true,
            messageTtl: RETRY_DELAY,
            deadLetterExchange: EXCHANGE,
            deadLetterRoutingKey: "forgot_password",
        });
        await channel.assertQueue(`${RETRY_QUEUE}_order_success`, {
            durable: true,
            messageTtl: RETRY_DELAY,
            deadLetterExchange: EXCHANGE,
            deadLetterRoutingKey: "order_success",
        });

        // Gắn queue với từng routing key
        await channel.bindQueue(QUEUE, EXCHANGE, "forgot_password");
        await channel.bindQueue(QUEUE, EXCHANGE, "order_success");
        console.log("[Notification] Listening on queue:", QUEUE);

        channel.consume(QUEUE, async (msg) => {
            if (!msg) return;
            const content = JSON.parse(msg.content.toString());
            console.log("[Notification] Received message:", content);

            try {
                switch (content.type) {
                    case "forgot_password":
                        await sendMail(content.to, content.subject, content.html);
                        break;
                    case "order_success":
                        // lấy email từ user-service
                        const response = await axios.get(`${USER_SERVICE_URL}/auth/me`, { headers: { "x-user-id": content.userId } });
                        const email = response.data.user.email;
                        const subject = `Đặt hàng thành công #${content.orderId}`;
                        const html = `Đơn hàng của bạn đã được xác nhận.<br>
                              Sản phẩm:<br>
                              ${content.orderDetail.map(i => `Size ${i.productSizeId}: ${i.quantity}`).join("<br>")}`;
                        await sendMail(email, subject, html);
                        break;
                    default:
                        console.warn("Unknown mail type:", content.type);
                }

                channel.ack(msg);
            } catch (err) {
                console.error("Error sending email:", err);
                handleRetry(channel, msg, content);
            }
        });
    } catch (err) {
        console.error("RabbitMQ connection error:", err);
    }
};
