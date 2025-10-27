import express from "express";
import { proxyRequest } from "../utils/httpProxy.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import serviceUrls from "../config/serviceUrls.js";

const router = express.Router();
const userService = serviceUrls.user;


// Router public
router.post("/auth/login", proxyRequest(userService));
router.post("/auth/register", proxyRequest(userService));
router.post("/auth/forgotPassword", proxyRequest(userService));
router.post("/auth/resetPassword", proxyRequest(userService));
router.get("/auth/google", proxyRequest(userService));

// Router private
router.post("/auth/refreshToken", proxyRequest(userService));
router.post("/auth/logout", proxyRequest(userService));
router.get("/auth/me", authMiddleware, proxyRequest(userService));

// Router admin
router.post("/auth/admin/create", authMiddleware, adminMiddleware, proxyRequest(userService));

export default router;
