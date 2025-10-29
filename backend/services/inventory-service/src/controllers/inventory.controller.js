import { updateInventoryService } from "../services/inventory.service.js";

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
    }

};

export { updateInventoryController };