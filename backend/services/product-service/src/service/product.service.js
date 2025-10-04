import { Product, ProductImage, ProductSize } from "../models/index.js";
import cloudinary from "../config/cloudinary.js";
import sequelize from "../config/db.js";

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

        const productWithRelations = await Product.findByPk(product.id, {
            attributes: ["id", "name", "description", "price", "bestSeller"],
            include: [
                { model: ProductImage, as: "images", attributes: ["url"] },
                { model: ProductSize, as: "sizes", attributes: ["size"] }
            ]
        });
        return productWithRelations;
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
export { addProductService };