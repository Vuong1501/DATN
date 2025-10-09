import { addCategoryService, getAllCategoryService, updateCategoryService } from "../services/category.service.js";

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
};

const updateCategory = async (req, res) => {
    try {
        const category = await updateCategoryService(req.params.id, req.body);
        res.status(200).json({
            message: 'Cập nhật danh mục thành công',
            category
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
export { addCategory, getAllCategory, updateCategory };