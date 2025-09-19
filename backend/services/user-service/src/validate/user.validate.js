import { body, validationResult } from "express-validator";

const validateRegister = [
    body("username")
        .notEmpty().withMessage("Tên không được bỏ trống")
        .isLength({ min: 3, max: 50 }).withMessage("Tên phải từ 3-50 ký tự"),

    body("email")
        .notEmpty().withMessage("Email không được bỏ trống")
        .isEmail().withMessage("Email không hợp lệ"),

    body("password")
        .notEmpty().withMessage("Mật khẩu không được bỏ trống")
        .isLength({ min: 6 }).withMessage("Mật khẩu phải ít nhất 6 ký tự"),

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
const validateLogin = [
    body("email")
        .notEmpty().withMessage("Email không được bỏ trống")
        .isEmail().withMessage("Email không hợp lệ"),

    body("password")
        .notEmpty().withMessage("Mật khẩu không được bỏ trống"),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const message = errors.array().map(err => err.msg);
            return res.status(400).json({ errors: message });
        }
        next();
    }
]

export { validateRegister, validateLogin };