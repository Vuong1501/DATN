import { addProductService, getCategoriesService, getAllProductService, updateProductService } from "../service/product.service.js";

const getCategories = async (req, res) => {
    try {
        const categories = await getCategoriesService();
        res.json({ categories });
    } catch (err) {
        console.error("❌ Lấy danh mục thất bại:", err.message);
        res.status(500).json({ message: "Lấy danh mục thất bại" });
    }
};

// thêm sản phẩm
const addProduct = async (req, res) => {
    try {
        const { name, description, price, category_id, sizes, bestseller } = req.body;

        const images = req.files;

        const product = await addProductService({ name, description, price, category_id, sizes, bestseller }, images);

        res.status(201).json({
            success: true,
            message: " Product created successfully",
            product,
        });
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ error: "Internal server error" });
    };
};

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, category_id, sizes, bestseller } = req.body;
        const images = req.files;

        const result = await updateProductService(id, { name, description, price, category_id, sizes, bestseller }, images);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error in updateProductController:", error);
        res.status(500).json({ error: error.message });
    }
};

// danh sách sản phẩm
const getAllProduct = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const result = await getAllProductService(page, limit);
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }

};

// xóa sản phẩm

// chi tiết sản phẩm

export { addProduct, getCategories, getAllProduct, updateProduct };