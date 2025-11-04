import express from "express";
import { proxyRequest } from "../utils/httpProxy.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import serviceUrls from "../config/serviceUrls.js";

const router = express.Router();
const inventoryService = serviceUrls.inventory;

router.patch("/updateInventory/:productSizeId", authMiddleware, adminMiddleware, proxyRequest(inventoryService));
router.patch("/updateInventoryMany", authMiddleware, adminMiddleware, proxyRequest(inventoryService));
router.get("/getAllStock", authMiddleware, adminMiddleware, proxyRequest(inventoryService));


export default router;