import express from "express";
import { createOrderController } from "../controllers/order.controller.js";
import { Op } from "sequelize";

const router = express.Router();

router.post("/create", createOrderController);
export default router;