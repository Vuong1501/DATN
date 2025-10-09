import express from "express";
import { addCategory, getAllCategory, updateCategory } from "../controllers/category.controller.js";

const router = express.Router();

router.post("/add", addCategory);
router.get("/getAll", getAllCategory);
router.put("/updateCategory/:id", updateCategory);

export default router;