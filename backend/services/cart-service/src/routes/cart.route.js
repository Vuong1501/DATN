import express from "express";
import { addCartController, updateItemSelectedController, updateQuantityController } from "../controllers.js/cart.controller.js";


const router = express.Router();
router.post("/add", addCartController);
router.put("/updateQuantity/:cartItemId", updateQuantityController);
router.patch("/:id/select", updateItemSelectedController);

export default router;