import { body, validationResult } from "express-validator";

const validateAddProduct = [
    body("name")
        .notEmpty().withMessage("Name is required")
        .isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("description")
        .notEmpty().withMessage("Description is required"),
    body("price")
        .isFloat({ gt: 0 }).withMessage("Price must be a positive number"),
    body("category_id")
        .notEmpty().withMessage("Category is required")
        .isInt().withMessage("Category ID must be an integer"),
    body("subCategory_id")
        .optional()
        .isInt().withMessage("SubCategory ID must be an integer"),
    body("sizes")
        .optional()
        .matches(/^([A-Z]+,)*[A-Z]+$/).withMessage("Sizes must be comma separated like 'S,M,L'"),
    body("bestseller")
        .optional()
        .isBoolean().withMessage("Bestseller must be true or false"),
    // middleware xử lý kết quả validate
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const message = errors.array().map(err => err.msg);
            return res.status(400).json({ errors: message });
        }
        next();
    }
];

export { validateAddProduct };