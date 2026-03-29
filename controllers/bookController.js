import Book from "../models/Book.js";
import Author from "../models/Author.js";
import Student from "../models/Student.js";
import LibraryAttendant from "../models/LibraryAttendant.js";

// Shared populate helper for checked-out books
const populateIfOut = (query) =>
  query
    .populate("authors", "name bio")
    .populate("borrowedBy", "name email studentId")
    .populate("issuedBy", "name staffId");

// GET /books
export const getBooks = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, author, status } = req.query;
    const filter = {};

    // Text search on title
    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    // Filter by author name (join-style: find author first)
    if (author) {
      const matchedAuthors = await Author.find({
        name: { $regex: author, $options: "i" },
      }).select("_id");
      filter.authors = { $in: matchedAuthors.map((a) => a._id) };
    }

    // Filter by status
    if (status && ["IN", "OUT"].includes(status.toUpperCase())) {
      filter.status = status.toUpperCase();
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [books, total] = await Promise.all([
      populateIfOut(
        Book.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 })
      ),
      Book.countDocuments(filter),
    ]);

    // Annotate overdue books
    const now = new Date();
    const data = books.map((book) => {
      const obj = book.toObject();
      if (obj.status === "OUT" && obj.returnDate) {
        obj.isOverdue = new Date(obj.returnDate) < now;
      }
      return obj;
    });

    res.json({
      success: true,
      data,
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

// GET /books/:id
export const getBook = async (req, res, next) => {
  try {
    const book = await populateIfOut(Book.findById(req.params.id));
    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    const obj = book.toObject();
    if (obj.status === "OUT" && obj.returnDate) {
      obj.isOverdue = new Date(obj.returnDate) < new Date();
    }

    res.json({ success: true, data: obj });
  } catch (error) {
    next(error);
  }
};

// POST /books
export const createBook = async (req, res, next) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json({ success: true, data: book });
  } catch (error) {
    next(error);
  }
};

// PUT /books/:id
export const updateBook = async (req, res, next) => {
  try {
    // Prevent manual override of borrow fields via update
    const restricted = ["status", "borrowedBy", "issuedBy", "returnDate"];
    restricted.forEach((field) => delete req.body[field]);

    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("authors", "name bio");

    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }
    res.json({ success: true, data: book });
  } catch (error) {
    next(error);
  }
};

// DELETE /books/:id
export const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }
    if (book.status === "OUT") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a book that is currently borrowed.",
      });
    }
    await book.deleteOne();
    res.json({ success: true, message: "Book deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// POST /books/:id/borrow
export const borrowBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }
    if (book.status === "OUT") {
      return res.status(400).json({
        success: false,
        message: "Book is already checked out.",
      });
    }

    const { studentId, attendantId, returnDate } = req.body;

    // Verify both entities exist
    const [student, attendant] = await Promise.all([
      Student.findById(studentId),
      LibraryAttendant.findById(attendantId),
    ]);

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    if (!attendant) {
      return res
        .status(404)
        .json({ success: false, message: "Attendant not found" });
    }

    book.status = "OUT";
    book.borrowedBy = studentId;
    book.issuedBy = attendantId;
    book.returnDate = new Date(returnDate);
    await book.save();

    await book.populate([
      { path: "authors", select: "name bio" },
      { path: "borrowedBy", select: "name email studentId" },
      { path: "issuedBy", select: "name staffId" },
    ]);

    res.json({
      success: true,
      message: "Book borrowed successfully.",
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

// POST /books/:id/return
export const returnBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }
    if (book.status === "IN") {
      return res.status(400).json({
        success: false,
        message: "Book is already in the library.",
      });
    }

    book.status = "IN";
    book.borrowedBy = null;
    book.issuedBy = null;
    book.returnDate = null;
    await book.save();

    res.json({
      success: true,
      message: "Book returned successfully.",
      data: book,
    });
  } catch (error) {
    next(error);
  }
};