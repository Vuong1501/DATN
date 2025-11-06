import express from "express";
import { proxyRequest } from "../utils/httpProxy.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import serviceUrls from "../config/serviceUrls.js";

const router = express.Router();
const cartService = serviceUrls.cart;

router.post("/add", authMiddleware, proxyRequest(cartService));
router.put("/updateQuantity/:cartItemId", authMiddleware, proxyRequest(cartService));
router.patch("/:id/select", authMiddleware, proxyRequest(cartService));




export default router;