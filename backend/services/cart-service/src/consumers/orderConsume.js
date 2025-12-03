import { Cart, CartItem } from "../models/index.js";
import { getChannel } from "../../common/rabbitmq/rabbitmq.js";
import { Op } from "sequelize";

const EXCHANGE = "inventory_exchange";
const CART_QUEUE = "cart_order_queue";


const consumeOrder = async () => {
    const channel = getChannel();

    await channel.assertExchange(EXCHANGE, "topic", { durable: true });
    await channel.assertQueue(CART_QUEUE, { durable: true });
    await channel.bindQueue(CART_QUEUE, EXCHANGE, "order.created");


    channel.consume(CART_QUEUE, async (msg) => {
        try {
            const data = JSON.parse(msg.content.toString());
            console.log("Cart received order.created:", data);
            const cart = await Cart.findOne({
                where: { userId: data.userId }
            });
            // console.log("cart", cart);

            if (cart) {
                const cartItemId = data.items.map(i => i.cartItemId);
                const result = await CartItem.destroy({
                    where: {
                        id: { [Op.in]: cartItemId },
                        cartId: cart.id,
                    }
                });
                // console.log(`Deleted ${result} cart items`);
            } else {
                console.log("No cart found for userId:", data.userId);
            }

            channel.ack(msg);
        } catch (error) {
            console.error("Failed to delete cart items:", error);
            channel.nack(msg, false, true);
        }

    })
};

export { consumeOrder };
