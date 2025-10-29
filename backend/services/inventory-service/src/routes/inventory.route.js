import express from "express";
import { updateInventoryController, updateInventoryManyController } from "../controllers/inventory.controller.js";
const router = express.Router();

router.patch("/updateInventory/:productSizeId", updateInventoryController);
router.patch("/updateInventoryMany", updateInventoryManyController);

export default router;