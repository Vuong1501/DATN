import { Product, ProductImage, ProductSize } from "../models/index.js";
import { getRedis } from "../../common/redis/redis.js";
import { getChannel } from "../../common/rabbitmq/rabbitmq.js";
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
    console.log("Gọi Category-service qua REST...");
    const response = await axios.get(`${CATEGORY_SERVICE_URL}/getAll`);

    const categories = response.data;

    // Lưu cache (1h)
    await redis.set("categories:all", JSON.stringify(categories), { EX: 3600 });
    // Đo thời gian chạy
    const elapsed = Date.now() - start;
    console.log(`Lấy danh mục qua REST mất ${elapsed}ms`);
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

        // publish event tạo tồn kho sang inventory-service
        const channel = getChannel();
        const productSizes = await ProductSize.findAll({
            where: { productId: product.id },
            attributes: ['id', 'size']
        });
        const eventPayload = {
            productId: product.id,
            name,
            price: parsedPrice,
            sizes: productSizes.map(s => ({
                id: s.id,
                size: s.size
            }))
        };
        await channel.publish("product_exchange", "product.created", Buffer.from(JSON.stringify(eventPayload)));
        console.log("Published event: product.created", eventPayload);

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

const updateProductService = async (id, { name, description, price, category_id, sizes, bestseller }, images) => {
    // Chuẩn hóa dữ liệu
    const parsedPrice = typeof price === "string" ? parseFloat(price) : price;
    const bestSellerBool = bestseller === true || bestseller === "true" || bestseller === "1" || bestseller === 1;
    const transaction = await sequelize.transaction();
    const uploadedPublicIds = []; // để xóa nếu rollback

    try {
        const product = await Product.findByPk(id, {
            include: [
                { model: ProductImage, as: "images" },
                { model: ProductSize, as: "sizes" }
            ]
        });
        if (!product) throw new Error("Sản phẩm không tồn tại");
        // Cập nhật thông tin cơ bản
        await product.update({
            name: name ?? product.name,
            description: description ?? product.description,
            price: parsedPrice ?? product.price,
            category_id: category_id ?? product.category_id,
            bestSeller: bestSellerBool ?? product.bestSeller
        }, { transaction });

        // Nếu có ảnh mới → xóa ảnh cũ và upload lại
        if (images && images.length > 0) {
            // Xóa ảnh cũ khỏi Cloudinary
            for (const img of product.images) {
                await cloudinary.uploader.destroy(img.imageId, { resource_type: "image" });
            }
            // Xóa bản ghi cũ
            await ProductImage.destroy({ where: { productId: product.id }, transaction });

            // Upload ảnh mới
            for (const file of images) {
                const { url, public_id } = await uploadToCloudinary(file);
                uploadedPublicIds.push(public_id);
                await ProductImage.create(
                    {
                        url, imageId: public_id,
                        productId: product.id
                    },
                    { transaction }
                );
            }
        };

        // Cập nhật size
        let sizeChanged = false;
        let oldSizes = [];
        let deletedSizes = [];
        let addedSizes = [];
        let keptSizes = [];
        if (sizes) {
            // Chuẩn hóa danh sách size mới
            const newSizes = sizes.split(",").map(s => s.trim()).filter(Boolean);

            // Lấy danh sách size cũ
            oldSizes = product.sizes.map(s => ({ id: s.id, size: s.size }));
            const oldSizeMap = new Map(oldSizes.map(s => [s.size, s.id]));
            const newSizeSet = new Set(newSizes);

            deletedSizes = oldSizes.filter(s => !newSizeSet.has(s.size));
            addedSizes = newSizes.filter(s => !oldSizeMap.has(s));
            keptSizes = oldSizes.filter(s => newSizeSet.has(s.size));
            // So sánh xem có thay đổi không
            sizeChanged = deletedSizes.length > 0 || addedSizes.length > 0;

            if (sizeChanged) {
                // Xóa các size cũ
                if (deletedSizes.length > 0) {
                    await ProductSize.destroy({ where: { id: deletedSizes.map(s => s.id) }, transaction });
                }

                // Tạo size mới
                if (addedSizes.length > 0) {
                    const newSizeRecords = addedSizes.map(size => ({ size, productId: product.id }));
                    await ProductSize.bulkCreate(newSizeRecords, { transaction });
                }
            };
        };
        //Commit trước khi gửi event
        await transaction.commit();

        // Gửi event sau khi cập nhật
        const channel = getChannel();
        if (sizeChanged) {
            // Nếu thay đổi size → gửi product.updated
            const allSizes = await ProductSize.findAll({
                where: { productId: product.id },
                attributes: ["id", "size"]
            });
            const eventPayload = {
                productId: product.id,
                name: product.name,
                price: product.price,
                deletedSizeIds: deletedSizes.map(s => s.id),
                addedSizes: allSizes.filter(s => addedSizes.includes(s.size)),
                keptSizes: allSizes.filter(s => keptSizes.map(k => k.size).includes(s.size))
            };
            await channel.publish(
                "product_exchange",
                "product.updated",
                Buffer.from(JSON.stringify(eventPayload))
            );

            console.log("Published event: product.updated", eventPayload);
        } else {
            const eventPayload = {
                productId: product.id,
                name: product.name,
                price: product.price,
                sizes: product.sizes
            };
            await channel.publish(
                "product_exchange",
                "product.cacheUpdated",
                Buffer.from(JSON.stringify(eventPayload))
            );

            console.log("Published event: product.cacheUpdated", eventPayload);
        }
        // Trả về dữ liệu chi tiết sản phẩm sau khi cập nhật
        const updatedProduct = await Product.findByPk(product.id, {
            include: [
                { model: ProductImage, as: "images", attributes: ["url"] },
                { model: ProductSize, as: "sizes", attributes: ["size"] }
            ]
        });

        return updatedProduct;
    } catch (error) {
        await transaction.rollback();
        // rollback: xóa ảnh đã upload mới
        if (uploadedPublicIds.length > 0) {
            await Promise.all(uploadedPublicIds.map(pid => cloudinary.uploader.destroy(pid, { resource_type: "image" })));
        }
        throw error;
    }
};
const getAllProductService = async (page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    // Lấy danh sách sản phẩm
    const count = await Product.count();

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
};

const deleteProductService = async (id) => {
    const product = await Product.findByPk(id);
    if (!product) throw new Error("Product not found");

    // lấy ra các size để xóa bên inventory
    const oldSize = await ProductSize.findAll({
        where: { productId: id },
        attributes: ["id"]
    });
    const sizeIds = oldSize.map(s => s.id);
    // xóa trong productSize
    await ProductSize.destroy({
        where: { productId: id }
    });
    //xóa trong productImage
    await ProductImage.destroy({
        where: { productId: id }
    });
    await product.destroy();

    // gửi event sang inventory
    const channel = getChannel();
    const eventPayload = {
        productId: product.id,
        sizeIds
    };
    await channel.publish(
        "product_exchange",
        "product.deleted",
        Buffer.from(JSON.stringify(eventPayload))
    );
    console.log(`Published event product_deleted for product ${id}`);
};

const getOneProductService = async (id) => {
    const product = await Product.findByPk(id);
    if (!product) throw new Error("Sản phẩm không tồn tại");
    const result = await Product.findByPk(id, {
        attributes: ["id", "name", "price", "bestSeller"],
        include: [
            {
                model: ProductImage,
                as: "images",
                attributes: ["url"]
            },
            {
                model: ProductSize,
                as: "sizes",
                attributes: ["size"]
            }
        ]
    });
    return result;
};

export { addProductService, getCategoriesService, getAllProductService, updateProductService, deleteProductService, getOneProductService };

