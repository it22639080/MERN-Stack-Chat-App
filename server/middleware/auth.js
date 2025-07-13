

// middleware to protect route

import User from "../models/User.js";
import jwt from 'jsonwebtoken';

export const protectRoute = async (req, res, next) => {
   
    try {
        const token = req.headers.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res.status(401).json({ success: false, message: "user not found" });
        }
        req.user = user; // Attach user to request object
        next();
    } catch (error) {
        console.error("Token verification failed:", error);
        return res.status(401).json({ success: false, message: error.message || "Unauthorized access"    });
    }
}