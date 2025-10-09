import express from "express";

import { addProduct, getCategories } from "../controllers/product.controller.js";
import { validateAddProduct } from "../validate/product.validate.js";
import upload from "../middleware/multer.js";

const router = express.Router();

router.get("/getCategory", getCategories);
router.post("/add", upload.array("images", 5), validateAddProduct, addProduct);

export default router;