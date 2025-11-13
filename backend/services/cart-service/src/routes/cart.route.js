import express from "express";
import {
    addCartController, updateItemSelectedController, updateQuantityController,
    deleteItemController, getAllController, deleteAfterPurchaseController
} from "../controllers.js/cart.controller.js";


const router = express.Router();
router.post("/add", addCartController);
router.put("/updateQuantity/:cartItemId", updateQuantityController);
router.patch("/:id/select", updateItemSelectedController);
router.delete("/:cartItemId", deleteItemController);
router.get("/getAll", getAllController);
router.post("/deleteAfterPurchase", deleteAfterPurchaseController); // xóa các sản phẩm đã được đặt hàng trong giỏ hàng

export default router;