import Category from "../models/category.model.js";

const addCategoryService = async ({ name, parent_id }) => {
    try {
        const category = await Category.create({
            name,
            parent_id: parent_id || null
        });
        return category;
    } catch (error) {
        throw new Error("Tạo danh mục lỗi: " + error.message);
    };
}

const getAllCategoryService = async () => {
    try {
        const categories = await Category.findAll();
        return categories;
    } catch (error) {
        throw new Error("Lấy danh sách danh mục lỗi: " + error.message);
    }
};
export { addCategoryService, getAllCategoryService };