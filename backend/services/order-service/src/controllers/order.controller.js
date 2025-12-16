import { createOrderService, completeFlashSaleOrderService } from "../services/order.service.js";

const createOrderController = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const { cartItemIds, phone, userName, address, ward, district, province, note } = req.body; // chỗ này cần validate
        const payload = { userId, cartItemIds, userName, phone, address, ward, district, province, note };

        const result = await createOrderService(payload);
        return res.status(201).json({
            success: true,
            message: "Tạo đơn hàng thành công",
            data: result
        });
    } catch (error) {
        console.error("createOrderController error:", error);
        return res.status(400).json({
            success: false,
            message: error.message || "Tạo đơn lỗi"
        });
    };
};

const completeFlashSaleOrder = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const {
            requestId,
            phone,
            userName,
            address,
            ward,
            district,
            province,
            note
        } = req.body;

        const payload = {
            requestId,
            userId,
            phone,
            userName,
            address,
            ward,
            district,
            province,
            note
        };

        const result = await completeFlashSaleOrderService(payload);

        res.json({ ok: true, data: result });
    } catch (error) {
        console.error("Flash sale complete error:", error);
        res.status(500).json({ message: "Server error" });
    }
}

export { createOrderController, completeFlashSaleOrder };