import express from "express";
import { proxyRequest } from "../utils/httpProxy.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import serviceUrls from "../config/serviceUrls.js";

const router = express.Router();
const orderService = serviceUrls.order;

router.post("/create", authMiddleware, proxyRequest(orderService));

export default router;