import { addCartService, updateItemSelectedService, updateQuantityService } from "../services/cart.service.js";

const addCartController = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        console.log("userId >>", userId);

        const { productId, sizeId, quantity } = req.body;
        const parsedQuantity = parseInt(quantity, 10);

        const result = await addCartService(userId, productId, sizeId, parsedQuantity);
        return res.status(200).json({
            message: "Đã thêm sản phẩm vào giỏ hàng.",
            data: result
        });
    } catch (error) {
        console.error("Lỗi khi thêm giỏ hàng:", error);
        return res.status(500).json({ message: "Lỗi server.", error: error.message });
    };
};

const updateItemSelectedController = async (req, res) => {
    try {
        const { id } = req.params;
        const { selected } = req.body;

        await updateItemSelectedService(id, selected);

        res.json({ message: "Cập nhật trạng thái thành công" })
    } catch (error) {
        console.error("Lỗi cập nhật tick chọn:", error);
        res.status(500).json({ message: "Lỗi server" });
    };
};

const updateQuantityController = async (req, res) => {
    try {
        const { cartItemId } = req.params;
        const { quantity } = req.body;
        // Kiểm tra dữ liệu hợp lệ
        if (!quantity || isNaN(quantity) || quantity <= 0) {
            return res.status(400).json({ message: "Số lượng không hợp lệ." });
        }
        const parsedQuantity = parseInt(quantity, 10);

        const result = await updateQuantityService(cartItemId, parsedQuantity);

        return res.status(200).json({
            success: true,
            message: "Cập nhật số lượng thành công",
            data: result
        })
    } catch (error) {
        console.error("Lỗi khi cập nhật số lượng:", error);
        return res.status(500).json({
            message: "Lỗi server.",
            error: error.message
        });
    }
};

export { addCartController, updateItemSelectedController, updateQuantityController };