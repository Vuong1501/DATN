import express from "express";
import { proxyRequest } from "../utils/httpProxy.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import serviceUrls from "../config/serviceUrls.js";

const router = express.Router();
const productService = serviceUrls.product;

router.get("/getAllProduct", proxyRequest(productService));
router.get("/:id", proxyRequest(productService));

router.put("/update/:id", authMiddleware, adminMiddleware, proxyRequest(productService))
router.get("/getCategory", proxyRequest(productService));
router.post("/add", authMiddleware, adminMiddleware, proxyRequest(productService));
router.delete("/delete/:id", authMiddleware, adminMiddleware, proxyRequest(productService));


export default router;