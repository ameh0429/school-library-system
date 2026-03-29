import jwt from "jsonwebtoken";
import LibraryAttendant from "../models/LibraryAttendant.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please log in.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const attendant = await LibraryAttendant.findById(decoded.id);

    if (!attendant) {
      return res.status(401).json({
        success: false,
        message: "The user belonging to this token no longer exists.",
      });
    }

    req.attendant = attendant;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};