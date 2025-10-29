import express from "express";
import { updateInventoryController } from "../controllers/inventory.controller.js";
const router = express.Router();

router.patch("/updateInventory/:productSizeId", updateInventoryController)

export default router;