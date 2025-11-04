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

const updateInventoryManyService = async (inventories) => {
    const redis = getRedis();
    const results = [];
    for (const { productSizeId, stock } of inventories) {
        // Bỏ qua nếu thiếu dữ liệu
        if (!productSizeId || stock === undefined) continue;

        const inventory = await Inventory.findOne({ where: { productSizeId } });
        if (!inventory) {
            console.log(`⚠️ Không tìm thấy tồn kho cho size ${productSizeId}`);
            continue;
        }

        // Cập nhật DB
        inventory.stock = stock;
        await inventory.save();

        // Cập nhật Redis
        const redisKey = `inventory:productSize:${productSizeId}`;
        await redis.set(redisKey, stock);

        console.log(`✅ Updated stock for size ${productSizeId}: ${stock}`);
        results.push({ productSizeId, stock });
    };
    return results;
};

const getAllStock = async () => {
    const redis = getRedis();
    const productKeys = await redis.keys("product:info:*");
    console.log("productKeys>>>", productKeys);

    if (productKeys.length === 0) {
        throw new Error("Không có sản phẩm trong cache!");
    };
    const result = [];
    for (const key of productKeys) {
        const productData = await redis.get(key);

        if (!productData) continue;

        const product = JSON.parse(productData);


        // Mỗi sản phẩm có nhiều size
        for (const s of product.sizes || []) {
            const stockKey = `inventory:productSize:${s.id}`;
            const stockValue = await redis.get(stockKey);
            const stock = stockValue ? Number(stockValue) : 0;

            result.push({
                productId: product.id,
                productName: product.name,
                sizeId: s.id,
                sizeName: s.size,
                stock,
            });
        }
    }
    result.sort((a, b) => a.productId - b.productId);

    return ({
        message: "Danh sách tồn kho hiện tại",
        total: result.length,
        data: result,
    });
};

export { updateInventoryService, updateInventoryManyService, getAllStock };