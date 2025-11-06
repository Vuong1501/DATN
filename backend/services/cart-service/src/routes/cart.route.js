import express from "express";
import { addCartController, updateItemSelectedController } from "../controllers.js/cart.controller.js";


const router = express.Router();
router.post("/add", addCartController);
router.patch("/:id/select", updateItemSelectedController);

export default router;