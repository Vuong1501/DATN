import express from "express";
import { updateInventoryController, updateInventoryManyController, getAllStockController } from "../controllers/inventory.controller.js";
const router = express.Router();

router.patch("/updateInventory/:productSizeId", updateInventoryController);
router.patch("/updateInventoryMany", updateInventoryManyController);
router.get("/getAllStock", getAllStockController);

export default router;