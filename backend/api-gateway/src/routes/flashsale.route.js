
import express from "express";
import { proxyRequest } from "../utils/httpProxy.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import serviceUrls from "../config/serviceUrls.js";

const router = express.Router();
const flashsaleService = serviceUrls.flashsale;

router.post("/admin/create", authMiddleware, adminMiddleware, proxyRequest(flashsaleService));
router.post("/buy", authMiddleware, proxyRequest(flashsaleService));
// router.post("/flash-sale/complete-order", authMiddleware, proxyRequest(flashsaleService));
// router.put("/updateQuantity/:cartItemId", authMiddleware, proxyRequest(cartService));
// router.patch("/:id/select", authMiddleware, proxyRequest(cartService));
// router.delete("/:cartItemId", authMiddleware, proxyRequest(cartService));
// router.get("/getAll", authMiddleware, proxyRequest(cartService));
// router.post("/deleteAfterPurchase", authMiddleware, proxyRequest(cartService));




export default router;