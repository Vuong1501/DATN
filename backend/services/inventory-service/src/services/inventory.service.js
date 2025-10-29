import Inventory from "../models/inventory.model.js";
import { getRedis } from "../../common/redis/redis.js";

const updateInventoryService = async (productSizeId, stock) => {
    const redis = getRedis();

    // 1. Cập nhật DB
    const inventory = await Inventory.findOne({ where: { productSizeId } });
    if (!inventory) throw new Error("Không tìm thấy tồn kho của size này!");
    inventory.stock = stock;
    await inventory.save();

    // 2. Cập nhật Redis
    const redisKey = `inventory:productSize:${productSizeId}`;
    await redis.set(redisKey, stock);

    console.log(`✅ Updated stock in DB & Redis for size ${productSizeId}: ${stock}`);

    return { productSizeId, stock };
};

export { updateInventoryService };