import { Cart, CartItem } from "../models/index.js";
import { getRedis } from "../../common/redis/redis.js";
import { getChannel } from "../../common/rabbitmq/rabbitmq.js";

const addCartService = async (userId, productId, sizeId, parsedQuantity) => {
    // kiểm tra giỏ hàng của user
    let cart = await Cart.findOne({ where: { userId: userId } });

    // nếu chưa có thì tạo mới cart
    if (!cart) {
        cart = await Cart.create({ userId: userId });
    };

    // kiểm tra sản sản phẩm vừa thêm đã có trong giỏ hàng chưa
    let item = await CartItem.findOne({
        where: {
            cartId: cart.id,
            productId: productId,
            productSizeId: sizeId
        }
    });
    if (item) {
        // nếu có => tăng số lượng
        item.quantity += parsedQuantity;
        await item.save();
    } else {
        // nếu chưa có => tạo item mới trong cartItem
        item = await CartItem.create({
            cartId: cart.id,
            productId: productId,
            productSizeId: sizeId,
            quantity: parsedQuantity
        });
    };
    return item;
};

const updateItemSelectedService = async (id, selected) => {
    const item = await CartItem.findByPk(id);
    if (!item) throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");

    item.isSelected = selected;
    await item.save();
    return item;
}

export { addCartService, updateItemSelectedService };