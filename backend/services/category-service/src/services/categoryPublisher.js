import { getChannel } from "../../common/rabbitmq/rabbitmq.js";

const publishCategoryEvent = async (action, data = null) => {
    const channel = getChannel();
    await channel.assertExchange("category_events", "fanout", { durable: false });
    // xem các câu hỏi trong PHẦN DANH MỤC VÀ PRODUCT bên QUESTION.txt

    const message = {
        event: `category.${action}`, // ví dụ: category.created, category.deleted
        timestamp: new Date(),
        data, // gửi kèm dữ liệu nếu cần (id, name, ...)
    };
    channel.publish("category_events", "", Buffer.from(JSON.stringify(message)));
    console.log(`📢 Published category.${action} event`);
}
export { publishCategoryEvent };