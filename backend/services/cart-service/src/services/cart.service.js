import { Cart, CartItem } from "../models/index.js";
import { getRedis } from "../../common/redis/redis.js";
import { Op } from "sequelize";

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

const updateItemSelectedService = async (id, selected, userId) => {
    const cart = await Cart.findOne({
        where: { userId }
    })
    if (!cart) throw new Error("Không tìm thấy giỏ hàng của người dùng");

    const item = await CartItem.findByPk(id);
    if (!item) throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");

    item.isSelected = selected;
    await item.save();
    return item;
};

const updateQuantityService = async (cartItemId, parsedQuantity, userId) => {
    const cart = await Cart.findOne({
        where: { userId }
    })
    if (!cart) throw new Error("Không tìm thấy giỏ hàng của người dùng");

    const item = await CartItem.findByPk(cartItemId);
    if (!item) {
        throw new Error("Không tìm thấy sản phẩm trong giỏ hàng.");
    };

    // cập nhật số lượng
    item.quantity = parsedQuantity;
    await item.save();
    return item;
};

const deleteItemService = async (cartItemId, userId) => {
    const cart = await Cart.findOne({
        where: { userId }
    })
    if (!cart) throw new Error("Không tìm thấy giỏ hàng của người dùng");

    const item = await CartItem.findByPk(cartItemId);
    if (!item) {
        throw new Error("Không tìm thấy sản phẩm trong giỏ hàng.");
    };

    await item.destroy();
    return true;
};

const getAllService = async (userId) => {
    const cart = await Cart.findOne({ where: { userId: userId } });
    if (!cart) return [];

    // lấy toàn bộ items trong giỏ hàng
    const cartItems = await CartItem.findAll({ where: { cartId: cart.id } });
    // console.log("cartItems>>>", cartItems);

    const result = [];
    const redis = getRedis();

    for (const item of cartItems) {
        const productKey = `product:info:${item.productId}`;
        const productCache = await redis.get(productKey);
        let productInfo = null;
        if (productCache) {
            productInfo = JSON.parse(productCache);
            // console.log("thông tin sản phẩm khi lấy danh sách >>>", productInfo);

        } else {
            // fallback: trường hợp cache mất, có thể gọi REST sang product-service
            productInfo = { id: item.productId, name: "Không tìm thấy sản phẩm", sizes: [] };
        };
        // tìm size trong mảng sizes
        const sizeObj = productInfo.sizes.find(s => s.id === item.productSizeId);
        // 4️⃣ Lấy tồn kho (nếu muốn)
        const stockKey = `inventory:productSize:${item.productSizeId}`;
        const stockValue = await redis.get(stockKey);
        const stock = stockValue ? Number(stockValue) : null;

        // 5️⃣ Chuẩn hóa dữ liệu trả về
        result.push({
            id: item.id,
            productId: item.productId,
            productName: productInfo.name,
            sizeId: item.productSizeId,
            sizeName: sizeObj?.size || "Không rõ",
            quantity: item.quantity,
            selected: item.isSelected,
            stock,
            isDeleted: item.isDeleted !== false,
            total: item.quantity * (productInfo.price || 0)
        });
    };
    // 6️⃣ Tính tổng tiền sản phẩm được chọn
    const totalSelected = result
        .filter(i => i.selected && !i.isDeleted)
        .reduce((sum, i) => sum + i.total, 0);

    return {
        cartId: cart.id,
        items: result,
        totalSelected
    };
};

const deleteAfterPurchaseService = async (cartItemIds, userId) => {

    const cart = await Cart.findOne({
        where: { userId }
    });
    if (!cart) return 0;
    const result = await CartItem.destroy({
        where: {
            id: { [Op.in]: cartItemIds },
            cartId: cart.id,
        }
    });
    return result;
};

export { addCartService, updateItemSelectedService, updateQuantityService, deleteItemService, getAllService, deleteAfterPurchaseService };