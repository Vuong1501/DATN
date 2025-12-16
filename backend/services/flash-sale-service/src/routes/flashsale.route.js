import express from "express";
import { buyFlashSale, createFlashSale, updateFlashSale } from "../controllers/flashsale.controller.js";

const router = express.Router();

router.post("/admin/create", createFlashSale);
router.put("/admin/flash-sale/:id", updateFlashSale);

router.post("/buy", buyFlashSale);


export default router;