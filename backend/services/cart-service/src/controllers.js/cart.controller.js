import {
    addCartService, updateItemSelectedService, updateQuantityService,
    deleteItemService, getAllService, deleteAfterPurchaseService
} from "../services/cart.service.js";

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
        const userId = req.headers["x-user-id"];

        const { id } = req.params;
        const { selected } = req.body;

        await updateItemSelectedService(id, selected, userId);

        res.json({ message: "Cập nhật trạng thái thành công" })
    } catch (error) {
        console.error("Lỗi cập nhật tick chọn:", error);
        res.status(500).json({ message: "Lỗi server" });
    };
};

const updateQuantityController = async (req, res) => {
    try {
        const { userId } = req.headers["x-user-id"];
        const { cartItemId } = req.params;
        const { quantity } = req.body;
        // Kiểm tra dữ liệu hợp lệ
        if (!quantity || isNaN(quantity) || quantity <= 0) {
            return res.status(400).json({ message: "Số lượng không hợp lệ." });
        }
        const parsedQuantity = parseInt(quantity, 10);

        const result = await updateQuantityService(cartItemId, parsedQuantity, userId);

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

const deleteItemController = async (req, res) => {
    try {
        const { userId } = req.headers["x-user-id"];
        const { cartItemId } = req.params;
        await deleteItemService(cartItemId, userId);
        return res.status(200).json({
            success: true,
            message: "Đã xóa sản phẩm khỏi giỏ hàng"
        });
    } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
        return res.status(500).json({
            message: "Lỗi server",
            error: error.message
        });
    };
};

const getAllController = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];

        const cartData = await getAllService(userId);
        return res.status(200).json({
            success: true,
            message: "Lấy danh sách giỏ hàng thành công",
            data: cartData
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách giỏ hàng:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server",
            error: error.message
        });
    }
};

const deleteAfterPurchaseController = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const { cartItemIds } = req.body;
        if (!cartItemIds || !Array.isArray(cartItemIds) || cartItemIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Danh sách cartItemIds không hợp lệ",
            });
        };
        const result = await deleteAfterPurchaseService(cartItemIds, userId);
        return res.status(200).json({
            success: true,
            message: `Đã xóa ${result} sản phẩm khỏi giỏ hàng sau khi đặt hàng`,
        });
    } catch (error) {
        console.error("Lỗi khi xóa sản phẩm sau khi đặt hàng:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server khi xóa sản phẩm khỏi giỏ hàng",
        });
    }
}

export { addCartController, updateItemSelectedController, updateQuantityController, deleteItemController, getAllController, deleteAfterPurchaseController };