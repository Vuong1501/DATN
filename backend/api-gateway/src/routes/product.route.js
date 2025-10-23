import express from "express";
import { proxyRequest } from "../utils/httpProxy.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import serviceUrls from "../config/serviceUrls.js";

const router = express.Router();
const productService = serviceUrls.product;
// http://product-service:3002

router.get("/getAllProduct", proxyRequest(productService)); // public
router.get("/:id", proxyRequest(productService)); // public

router.get("/getCategory", proxyRequest(productService));
router.post("/add", authMiddleware, adminMiddleware, proxyRequest(productService));

// router.post("/", authMiddleware, adminMiddleware, proxyRequest(productService)); // admin
// router.put("/:id", authMiddleware, adminMiddleware, proxyRequest(productService)); // admin
// router.delete("/:id", authMiddleware, adminMiddleware, proxyRequest(productService)); // admin

export default router;