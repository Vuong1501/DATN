import { createFlashSaleService, buyFlashSaleService, updateFlashSaleService } from "../services/flashsale.service.js";

const createFlashSale = async (req, res) => {
    try {
        const { productId, productSizeId, flashPrice, flashStock, startTime, endTime } = req.body;
        const payload = { productId, productSizeId, flashPrice, flashStock, startTime, endTime };
        console.log("payload >>>>", payload);

        const result = await createFlashSaleService(payload);
        res.json({ ok: true, data: result });
    } catch (error) {
        console.log("error", error);
        res.status(400).json({ ok: false, message: error.message });
    }
};

const updateFlashSale = async (req, res) => {
    try {
        const { flashStock } = req.body;
        const payload = { flashStock }
        const id = req.params.id;
        const result = await updateFlashSaleService(id, payload);
        res.json({ ok: true, data: result });
    } catch (error) {
        console.log("error", error);
        res.status(400).json({ ok: false, message: error.message });
    }
}

const buyFlashSale = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        console.log("userId>>>", userId);

        const { productSizeId, quantity } = req.body;
        if (!Number.isInteger(quantity) || quantity <= 0) {
            throw new Error("Invalid quantity");
        }

        const result = await buyFlashSaleService(userId, productSizeId, quantity);
        return res.json({
            message: "success",
            data: result
        });
    } catch (error) {
        const code = error.code?.toString() || "";
        if (code === "-4" || error.message === "OUT_OF_STOCK") {
            return res.status(400).json({ ok: false, message: "Hết hàng flash sale" });
        }
        if (code === "-1") return res.status(400).json({ ok: false, message: "Flash sale chưa bắt đầu" });
        if (code === "-2") return res.status(400).json({ ok: false, message: "Flash sale đã kết thúc" });
        if (code === "-3") return res.status(429).json({ ok: false, message: "Bạn thao tác quá nhanh, thử lại" });
        if (error.message === "NO_FLASH_INFO") return res.status(404).json({ ok: false, message: "Sản phẩm không thuộc flash sale" });

        console.error("buyFlashHandler error:", error);
        return res.status(500).json({ ok: false, message: "Server error" });
    }
};

export { createFlashSale, buyFlashSale, updateFlashSale };