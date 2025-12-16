import FlashSale from "../models/flashsale.model.js";
import { preloadToRedis } from "../services/flashsale.service.js";
import { Op } from "sequelize";

const BUFFER_MS = 5 * 60 * 1000; // 5 phút
const INTERVAL_MS = 30 * 1000;  // chạy mỗi 30 giây

const startFlashSalePreload = () => {
    console.log("Flashsale bắt đầu cache");
    setInterval(async () => {
        try {
            const now = Date.now();
            // console.log(
            //     "⏱ [CRON CHECK]",
            //     new Date(now).toLocaleTimeString("vi-VN")
            // );
            const sales = await FlashSale.findAll({
                where: {
                    isPreloaded: false,
                    startTime: {
                        [Op.gt]: now,
                        [Op.lte]: now + BUFFER_MS
                    }
                }
            });
            // console.log("🔎 Found sales:", sales.length);
            for (const sale of sales) {
                console.log("⚡ Preload Redis NOW (sale < 5 phút)");
                console.log("flashSaleId:", sale.id);

                await preloadToRedis(sale);

                await sale.update({ isPreloaded: true });
            }
        } catch (err) {
            console.error("❌ FlashSale preload job error:", err);
        }
    }, INTERVAL_MS);
};

export { startFlashSalePreload };