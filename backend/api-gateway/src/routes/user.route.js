import express from "express";
import { proxyRequest } from "../utils/httpProxy.js";
import serviceUrls from "../config/serviceUrls.js";

const router = express.Router();
const userService = serviceUrls.user;

router.post("/auth/register", proxyRequest(userService));
router.post("/auth/login", proxyRequest(userService));
router.get("/profile", proxyRequest(userService));

export default router;
