import jwt from "jsonwebtoken";
import LibraryAttendant from "../models/LibraryAttendant.js";

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// POST /attendants/login
export const loginAttendant = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const attendant = await LibraryAttendant.findOne({ email }).select(
      "+password"
    );

    if (!attendant || !(await attendant.comparePassword(password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const token = signToken(attendant._id);
    attendant.password = undefined;

    res.json({ success: true, token, data: attendant });
  } catch (error) {
    next(error);
  }
};

// GET /attendants
export const getAttendants = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { staffId: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const [attendants, total] = await Promise.all([
      LibraryAttendant.find(filter)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      LibraryAttendant.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: attendants,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /attendants/:id
export const getAttendant = async (req, res, next) => {
  try {
    const attendant = await LibraryAttendant.findById(req.params.id);
    if (!attendant) {
      return res
        .status(404)
        .json({ success: false, message: "Attendant not found" });
    }
    res.json({ success: true, data: attendant });
  } catch (error) {
    next(error);
  }
};

// POST /attendants
export const createAttendant = async (req, res, next) => {
  try {
    const attendant = await LibraryAttendant.create(req.body);
    res.status(201).json({ success: true, data: attendant });
  } catch (error) {
    next(error);
  }
};

// PUT /attendants/:id
export const updateAttendant = async (req, res, next) => {
  try {
    // Prevent password update via this route
    delete req.body.password;

    const attendant = await LibraryAttendant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!attendant) {
      return res
        .status(404)
        .json({ success: false, message: "Attendant not found" });
    }
    res.json({ success: true, data: attendant });
  } catch (error) {
    next(error);
  }
};

// DELETE /attendants/:id
export const deleteAttendant = async (req, res, next) => {
  try {
    const attendant = await LibraryAttendant.findByIdAndDelete(req.params.id);
    if (!attendant) {
      return res
        .status(404)
        .json({ success: false, message: "Attendant not found" });
    }
    res.json({ success: true, message: "Attendant deleted successfully" });
  } catch (error) {
    next(error);
  }
};