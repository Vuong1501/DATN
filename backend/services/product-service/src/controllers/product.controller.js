import { addProductService } from "../service/product.service.js";

// thêm sản phẩm
const addProduct = async (req, res) => {
    try {
        const { name, description, price, category_id, sizes, bestseller } = req.body;

        const images = req.files;

        const product = await addProductService({ name, description, price, category_id, sizes, bestseller }, images);

        res.status(201).json({
            message: " Product created successfully",
            product,
        });
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ error: "Internal server error" });
    };
};

// danh sách sản phẩm

// xóa sản phẩm

// chi tiết sản phẩm

export { addProduct };