import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    console.log("TOken nhận từ fe >>>>", token);

    if (!token) return res.status(401).json({ message: "Missing token" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        req.headers['x-user-id'] = decoded.id;

        next();
    } catch {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
};

export const adminMiddleware = (req, res, next) => {

    if (req.user?.role !== "admin")
        return res.status(403).json({ message: "Admin access only" });
    next();
};