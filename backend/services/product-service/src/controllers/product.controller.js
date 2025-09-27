import { addProductService } from "../service/product.service.js";

// thêm sản phẩm
const addProduct = (req, res) => {
    try {
        const { name, description, price, category, subCategory, sizes, bestseller } = req.body;
        const image1 = req.files.image1[0];
        const image2 = req.files.image1[1];
        const image3 = req.files.image1[2];
        const image4 = req.files.image1[3];
    } catch (error) {

    }
}

// danh sách sản phẩm

// xóa sản phẩm

// chi tiết sản phẩm

export { addProduct };