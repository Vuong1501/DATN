import { Product, ProductImage, ProductSize } from "../models/index.js";
import { getRedis } from "../../common/redis/redis.js";
import cloudinary from "../config/cloudinary.js";
import sequelize from "../config/db.js";
import axios from "axios";

const CATEGORY_SERVICE_URL = "http://category-service:3003/category";

// hàm upload 1 file buffer lên cloudinary
const uploadToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "products",
                resource_type: "image",
            },
            (error, result) => {
                if (error) return reject(error);
                resolve({ url: result.secure_url, public_id: result.public_id });
            }
        );// chỉ đang tạo ra, rồi chạy xuống dòng dưới đẩy dữ liệu vào đã
        stream.end(file.buffer); // đẩy buffer vào cloudinary
    });
};

// Hàm chung để gọi rest và lấy cache danh mục
const getCategoriesService = async () => {
    const redis = getRedis();

    // Đo thời gian bắt đầu
    const start = Date.now();

    // Kiểm tra cache
    const cached = await redis.get("categories:all");
    if (cached) {
        const elapsed = Date.now() - start;
        console.log(`⚡ Lấy danh mục từ Redis cache (${elapsed}ms)`);
        return JSON.parse(cached);
    }

    // Gọi Category-service qua REST
    console.log("🌐 Gọi Category-service qua REST...");
    const response = await axios.get(`${CATEGORY_SERVICE_URL}/getAll`);

    const categories = response.data;

    // Lưu cache (1h)
    await redis.set("categories:all", JSON.stringify(categories), { EX: 3600 });
    // Đo thời gian chạy
    const elapsed = Date.now() - start;
    console.log(`⏱️ Lấy danh mục qua REST mất ${elapsed}ms`);
    return categories;
};

const addProductService = async ({ name, description, price, category_id, sizes, bestseller }, images) => {

    // Chuẩn hóa dữ liệu
    const parsedPrice = typeof price === "string" ? parseFloat(price) : price;
    const bestSellerBool = bestseller === true || bestseller === "true" || bestseller === "1" || bestseller === 1;

    const transaction = await sequelize.transaction();
    const uploadedPublicIds = []; // để xóa nếu rollback

    try {
        // Tạo product trong transaction
        const product = await Product.create({
            name, description, price: parsedPrice, category_id, bestSeller: bestSellerBool
        }, { transaction });

        // Upload ảnh
        if (images && images.length > 0) {
            for (const file of images) {
                const { url, public_id } = await uploadToCloudinary(file);

                uploadedPublicIds.push(public_id);
                await ProductImage.create({
                    url,
                    imageId: public_id,
                    productId: product.id
                }, { transaction });
            }
        };

        if (sizes) {
            const sizeList = sizes.split(",").map(s => s.trim()).filter(Boolean);

            for (const size of sizeList) {
                await ProductSize.create({ size, productId: product.id }, { transaction });
            }
        }
        await transaction.commit();

        // Lấy danh mục từ cache (hoặc gọi REST nếu chưa có)
        const categories = await getCategoriesService();
        const found = categories.find(c => c.id === parseInt(category_id));
        const categoryName = found ? found.name : null;

        const productWithRelations = await Product.findByPk(product.id, {
            attributes: ["id", "name", "description", "price", "bestSeller"],
            include: [
                { model: ProductImage, as: "images", attributes: ["url"] },
                { model: ProductSize, as: "sizes", attributes: ["size"] }
            ]
        });

        const productResponse = {
            ...productWithRelations.toJSON(),
            category: categoryName || null
        };
        return productResponse;
    } catch (err) {
        await transaction.rollback();
        // xóa những ảnh đã upload trên Cloudinary
        try {
            await Promise.all(uploadedPublicIds.map(pid => cloudinary.uploader.destroy(pid, { resource_type: "image" })));
        } catch (cleanupErr) {
            console.error("Failed to cleanup uploaded images:", cleanupErr);
        }
        throw err;
    }
};

const getAllProductService = async (page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    // Lấy danh sách sản phẩm
    const count = await Product.count();
    console.log("count>>>>", count);

    const products = await Product.findAll({
        include: [{ model: ProductImage, as: "images", attributes: ["url"] }],
        order: [["createdAt", "DESC"]],
        limit,
        offset
    });

    // Lấy categories từ Redis hoặc rest
    const categories = await getCategoriesService();

    // Map category name vào từng product
    const productsWithCategory = products.map(p => {
        const cat = categories.find(c => c.id === p.category_id);
        return {
            ...p.toJSON(),
            categoryName: cat ? cat.name : null
        };
    });

    return {
        total: count,
        page,
        limit,
        products: productsWithCategory
    };
}

export { addProductService, getCategoriesService, getAllProductService };