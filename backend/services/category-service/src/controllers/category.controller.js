import { addCategoryService, getAllCategoryService } from "../services/category.service.js";

const addCategory = async (req, res) => {
    try {
        const { name, parent_id } = req.body;
        const category = await addCategoryService({ name, parent_id });
        res.status(201).json({ message: "Category created", category });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllCategory = async (req, res) => {
    try {
        const categories = await getAllCategoryService();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
export { addCategory, getAllCategory };