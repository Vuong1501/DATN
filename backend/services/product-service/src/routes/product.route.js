import express from "express";

import { addProduct } from "../controllers/product.controller.js";
import { validateAddProduct } from "../validate/product.validate.js";
import upload from "../middleware/multer.js";

const router = express.Router();

router.post("/add", upload.array("images", 5), validateAddProduct, addProduct);

export default router;