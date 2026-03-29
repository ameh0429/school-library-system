import Student from "../models/Student.js";
import Book from "../models/Book.js";

// GET /students
export const getStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { studentId: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const [students, total] = await Promise.all([
      Student.find(filter)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Student.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: students,
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

// GET /students/:id
export const getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    // Include books currently borrowed by this student
    const borrowedBooks = await Book.find({ borrowedBy: student._id })
      .select("title isbn returnDate")
      .lean();

    const now = new Date();
    const books = borrowedBooks.map((b) => ({
      ...b,
      isOverdue: b.returnDate ? new Date(b.returnDate) < now : false,
    }));

    res.json({ success: true, data: { ...student.toObject(), borrowedBooks: books } });
  } catch (error) {
    next(error);
  }
};

// POST /students
export const createStudent = async (req, res, next) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

// PUT /students/:id
export const updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

// DELETE /students/:id
export const deleteStudent = async (req, res, next) => {
  try {
    const hasBorrowedBooks = await Book.exists({ borrowedBy: req.params.id });
    if (hasBorrowedBooks) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete student with active borrowed books.",
      });
    }

    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }
    res.json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    next(error);
  }
};