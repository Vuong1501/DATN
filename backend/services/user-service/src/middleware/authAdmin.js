import jwt from "jsonwebtoken";

const authAdmin = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized" });
        };
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== "admin") {
            return res.status(403).json({ error: "Forbidden: Admin only" });
        };
        req.user = decoded; // lưu thông tin user vào request
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
};

export { authAdmin };