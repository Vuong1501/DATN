import express from "express";
import { createOrderController, completeFlashSaleOrder } from "../controllers/order.controller.js";
import { Op } from "sequelize";

const router = express.Router();

router.post("/create", createOrderController);
router.post("/flash-sale/complete-order", completeFlashSaleOrder);
export default router;