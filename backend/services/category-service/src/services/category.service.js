import Category from "../models/category.model.js";
import { publishCategoryEvent } from "./categoryPublisher.js";

const addCategoryService = async ({ name, parent_id }) => {
    try {
        const category = await Category.create({
            name,
            parent_id: parent_id || null
        });

        await publishCategoryEvent("create", {
            id: category.id,
            name: category.name,
            parent_id: category.parent_id
        });
        return category;
    } catch (error) {
        throw new Error("Tạo danh mục lỗi: " + error.message);
    };
};

const getAllCategoryService = async () => {
    try {
        const categories = await Category.findAll();
        return categories;
    } catch (error) {
        throw new Error("Lấy danh sách danh mục lỗi: " + error.message);
    }
};

const updateCategoryService = async (id, { name, parent_id }) => {
    try {
        const category = await Category.findByPk(id);
        if (!category) throw new Error("Danh mục không tồn tại");
        category.name = name || category.name;
        category.parent_id = parent_id || category.parent_id;
        await category.save();

        await publishCategoryEvent("update", {
            id: category.id,
            name: category.name,
            parent_id: category.parent_id
        });
        return category;

    } catch (error) {
        throw new Error("Sửa danh mục lỗi: " + error.message);
    }
};
export { addCategoryService, getAllCategoryService, updateCategoryService };