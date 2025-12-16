import { Order, OrderDetail, FlashPendingOrder, sequelize } from "../models/index.js";
import { getRedis } from "../../common/redis/redis.js";
import { getChannel } from "../../common/rabbitmq/rabbitmq.js";
import axios from "axios";

const CART_SERVICE_URL = "http://cart-service:3006/cart";


const createOrderService = async (payload) => {
    const { userId, cartItemIds, phone, userName, address, ward, district, province, note } = payload;
    const redis = getRedis();

    // lấy các sản phẩm được tick chọn
    let orderCandidates = []; // tạo mảng các sp sẽ đặt
    if (Array.isArray(cartItemIds) && cartItemIds.length > 0) {
        const response = await axios.get(`${CART_SERVICE_URL}/getAll`, {
            headers: { "x-user-id": userId }
        });
        const cartItems = response.data.data.items || [];
        orderCandidates = cartItems
            .filter(i => i.selected && cartItemIds.includes(i.id))
            .map(i => ({
                cartItemId: i.id,
                productId: i.productId,
                productSizeId: i.sizeId,
                quantity: i.quantity
            }));
        // console.log("cartItems >>>>", cartItems);
        // console.log("orderCandidates >>>>", orderCandidates);
    };
    if (!orderCandidates.length) throw new Error("Không có sản phẩm nào để đặt hàng");

    // lấy giá, tên sản phẩm, kiểm tra tồn kho
    const result = [];
    for (const item of orderCandidates) {
        const productKey = `product:info:${item.productId}`;
        const productRaw = await redis.get(productKey);
        if (!productRaw) throw new Error(`Không tìm thấy sản phẩm id=${c.productId}`);
        const product = JSON.parse(productRaw);

        // tìm các sizeId mà người dùng gửi lên
        const sizeObj = (product.sizes || []).find(s => Number(s.id) === Number(item.productSizeId));
        if (!sizeObj) throw new Error(`Không tìm thấy sizeId=${c.productSizeId} cho productId=${c.productId}`);

        const price = Number(product.price);

        // lấy ra tồn kho
        const stockKey = `inventory:productSize:${item.productSizeId}`;
        const stock = redis.get(stockKey);
        if (stock === null) throw new Error(`Không xác định được tồn kho cho productSizeId=${c.productSizeId}`);
        if (Number(stock) < item.quantity) throw new Error(`Sản phẩm không đủ tồn kho. productId=${c.productId}, sizeId=${c.productSizeId}`)

        result.push({
            ...item,
            productName: product.name,
            sizeName: sizeObj.size,
            price,
            subtotal: price * item.quantity
        });
    };
    // console.log("result>>>", result);

    //tạo order và order detail trong transaction
    const t = await sequelize.transaction();
    try {
        const totalAmount = result.reduce((sum, item) => sum + item.subtotal, 0);

        const order = await Order.create({
            userId,
            username: userName,
            phone,
            address,
            ward,
            district,
            province,
            totalAmount,
            status: "pending",
            note
        }, { transaction: t });

        const orderDetail = result.map(item => ({
            orderId: order.id,
            productId: item.productId,
            productName: item.productName,
            productSizeId: item.productSizeId,
            sizeName: item.sizeName,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal
        }));

        await OrderDetail.bulkCreate(orderDetail, { transaction: t });
        await t.commit();

        // gửi sự kiện sang các service khác
        const channel = await getChannel();
        const payload = {
            orderId: order.id,
            userId,
            items: orderDetail.map((item, index) => ({
                productSizeId: item.productSizeId,
                quantity: item.quantity,
                cartItemId: orderCandidates[index].cartItemId
            })),
        }
        // console.log("test >>>>>>", payload);

        channel.publish("inventory_exchange", "order.created", Buffer.from(JSON.stringify(payload)));
    } catch (error) {
        console.error("Publish event failed:", error);
    }

};

const completeFlashSaleOrderService = async (payload) => {
    const { requestId,
        userId,
        phone,
        userName,
        address,
        ward,
        district,
        province,
        note } = payload;

    // lấy dữ liệu từ bảng tạm
    const pending = await FlashPendingOrder.findOne({ where: { requestId } });
    if (!pending) {
        throw new Error("RequestId không hợp lệ hoặc đã hết hạn");
    }

    if (pending.status !== "PENDING") {
        throw new Error("Đơn này đã được sử dụng hoặc đã hoàn tất");
    }

    // kiểm tra xem còn trong 10p không
    const createdAt = new Date(pending.createdAt).getTime();
    if (Date.now() - createdAt > 10 * 60 * 1000) {
        throw new Error("Mã requestId đã hết hạn (quá 10 phút)");
    }

    const { productId, productSizeId, quantity, price } = pending;
    // Tạo snapshot subtotal
    const subtotal = Number(price) * quantity;

    // tạo đơn hàng thật giống luồng khi mua bình thường
    const t = await sequelize.transaction();
    try {
        const order = await Order.create({
            userId,
            phone,
            username: userName,
            address,
            ward,
            district,
            province,
            totalAmount: subtotal,
            note,
            status: "pending"
        }, { transaction: t });

        //tạo orderDetail
        await OrderDetail.create({
            orderId: order.id,
            productId,
            productSizeId,
            productName: `FlashSale Product ${productId}`, // Nếu bạn muốn fetch thêm ở product-service thì bổ sung sau
            sizeName: `Size ${productSizeId}`,              // Nếu muốn lấy real size thì gọi tiếp API
            price,
            quantity,
            subtotal
        }, { transaction: t });

        // update bảng tạm
        await pending.update({ status: "CONFIRMED" }, { transaction: t });
        await t.commit();

        //publish event sang inventory-service
        const channel = getChannel();
        const payload = {
            orderId: order.id,
            userId,
            items: [
                {
                    productSizeId,
                    quantity
                }
            ]
        };
        channel.publish("inventory_exchange", "order.created", Buffer.from(JSON.stringify(payload)));
        return order;
    } catch (error) {
        await t.rollback();
        throw error;
    }
};

export { createOrderService, completeFlashSaleOrderService }