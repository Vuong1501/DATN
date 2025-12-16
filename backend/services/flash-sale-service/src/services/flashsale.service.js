
import { getRedis } from "../../common/redis/redis.js";
import { getChannel } from "../../common/rabbitmq/rabbitmq.js";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import FlashSale from "../models/flashsale.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const luaPath = path.join(__dirname, "../lua/flashsale.lua");
const luaScript = fs.readFileSync(luaPath, "utf8");
const STOCK_KEY = (productSizeId) => `flash_sale:stock:${productSizeId}`;
const INFO_KEY = (productSizeId) => `flash_sale:info:${productSizeId}`;
const USER_LOCK_KEY = (userId, productSizeId) => `flash_sale:user_lock:${userId}:${productSizeId}`;

const BUFFER_MS = 5 * 60 * 1000; // 5 phút

/* ---------------------- Utils: Preload Redis ------------------------- */
const preloadToRedis = async (flashSale) => {
    const redis = await getRedis();

    await redis.set(STOCK_KEY(flashSale.productSizeId), flashSale.flashStock);

    await redis.set(
        INFO_KEY(flashSale.productSizeId),
        JSON.stringify({
            productId: flashSale.productId,
            flashPrice: flashSale.flashPrice,
            startTime: Number(flashSale.startTime),
            endTime: Number(flashSale.endTime)
        })
    );

    console.log("🔥 [FLASH SALE PRELOAD]");
    console.log("productSizeId:", flashSale.productSizeId);
    console.log("stock:", flashSale.flashStock);
    console.log(
        "start:",
        new Date(flashSale.startTime).toLocaleString("vi-VN")
    );
    console.log(
        "end:",
        new Date(flashSale.endTime).toLocaleString("vi-VN")
    );
};

const createFlashSaleService = async (payload) => {
    const {
        productId,
        productSizeId,
        flashPrice,
        flashStock,
        startTime,
        endTime
    } = payload;

    if (startTime >= endTime) {
        throw new Error("startTime phải nhỏ hơn endTime");
    }

    const flashSale = await FlashSale.create({
        productId,
        productSizeId,
        flashPrice,
        flashStock,
        startTime,
        endTime
    });

    // nếu gần giờ sale (< 5 phút) thì cache ngay
    const now = Date.now();
    const diff = flashSale.startTime - now;

    console.log("📌 NOW =", now);
    console.log("📌 NOW (human) =", new Date(now).toLocaleString("vi-VN"));

    const start = now + 7 * 60 * 1000; // bắt đầu sau 7 phút
    const end = start + 300 * 60 * 1000; // kết thúc sau 10 phút

    console.log("📌 START_TIME =", start);
    console.log("📌 START (human) =", new Date(start).toLocaleString("vi-VN"));

    console.log("📌 END_TIME =", end);
    console.log("📌 END (human) =", new Date(end).toLocaleString("vi-VN"));

    console.log("🕒 [FLASH SALE TIME CHECK]");
    console.log("now:", new Date(now).toLocaleString("vi-VN"));
    console.log(
        "startTime:",
        new Date(flashSale.startTime).toLocaleString("vi-VN")
    );
    console.log("diff(ms):", diff);

    if (diff <= BUFFER_MS) {
        console.log("⚡ Preload Redis NOW (sale < 5 phút)");
        await preloadToRedis(flashSale);
    } else {
        console.log("⏳ Chưa preload (sale > 5 phút)");
    }

    // if (flashSale.startTime - now <= BUFFER_MS) {
    //     await preloadToRedis(flashSale);
    // }
    return flashSale;
};

const updateFlashSaleService = async (payload) => {
    const flashSale = await FlashSale.findByPk(id);
    if (!flashSale) throw new Error("Flash sale không tồn tại");
    // nếu sale đã bắt đầu → cấm update
    const now = Date.now();
    if (now >= flashSale.startTime) {
        throw new Error("Không thể cập nhật vì flash sale đã bắt đầu")
    };
    // cập nhật DB
    await flashSale.update(payload);

    // nếu Redis đã preload → cập nhật Redis ngay
    if (flashSale.startTime - now <= BUFFER_MS) {
        await preloadToRedis(flashSale);
    }

    return flashSale;
}

const buyFlashSaleService = async (userId, productSizeId, quantity) => {
    const redis = await getRedis();

    // lấy thông tin từ redis
    const infoRaw = await redis.get(INFO_KEY(productSizeId));
    if (!infoRaw) {
        throw new Error("NO_FLASH_INFO");
    };
    const info = JSON.parse(infoRaw);
    const now = Date.now();

    const lockKey = USER_LOCK_KEY(userId, productSizeId);

    const res = await redis.eval(luaScript, {
        keys: [
            STOCK_KEY(productSizeId),
            lockKey,
            INFO_KEY(productSizeId)
        ],
        arguments: [
            now.toString(),
            "1",
            quantity.toString()
        ]
    });

    // res is number codes per our Lua
    const code = Number(res);
    if (code !== 1) {
        // map codes to messages
        const map = {
            "-1": "NOT_STARTED",
            "-2": "ENDED",
            "-3": "USER_SPAM",
            "-4": "OUT_OF_STOCK",
            "-5": "NO_STOCK_KEY"
        };
        const msg = map[String(code)] || "LUA_ERROR";
        const err = new Error(msg);
        err.code = code;
        throw err;
    }

    // publish sự kiện sang bên order-service (đây là work queue chứ không phải là pub sub)
    const channel = await getChannel();
    await channel.assertExchange("flash_exchange", "topic", { durable: true });


    const requestId = uuidv4();
    const payload = {
        requestId,
        userId: String(userId),
        productSizeId,
        productId: info.productId,
        quantity,
        price: info.flashPrice,
        timestamp: now
    };

    channel.publish(
        "flash_exchange",
        "flash.order",
        Buffer.from(JSON.stringify(payload)),
        { persistent: true }
    );
    const remaining = await redis.get(STOCK_KEY(productSizeId));
    return { ok: true, requestId, remaining: Number(remaining) };

};

export { createFlashSaleService, buyFlashSaleService, updateFlashSaleService, preloadToRedis }