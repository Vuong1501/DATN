import { updateInventoryService, updateInventoryManyService } from "../services/inventory.service.js";

const updateInventoryController = async (req, res) => {
    try {
        const { productSizeId } = req.params;
        const { stock } = req.body;
        const result = await updateInventoryService(productSizeId, stock);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    };
};

const updateInventoryManyController = async (req, res) => {
    try {
        const { inventories } = req.body; // [{ productSizeId, stock }, ...]
        console.log("inven", inventories);

        if (!Array.isArray(inventories) || inventories.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Danh sách inventories không hợp lệ hoặc trống!"
            });
        };

        const result = await updateInventoryManyService(inventories);
        res.json({
            success: true,
            message: "Đã cập nhật tồn kho thành công!",
            data: result
        });
    } catch (error) {
        console.log("lỗi>>>", error);

        res.status(500).json({
            success: false,
            message: error.message
        });
    };
};

export { updateInventoryController, updateInventoryManyController };