import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Book title is required"],
      trim: true,
    },
    isbn: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    authors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Author",
      },
    ],
    status: {
      type: String,
      enum: {
        values: ["IN", "OUT"],
        message: "Status must be either IN or OUT",
      },
      default: "IN",
    },
    borrowedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LibraryAttendant",
      default: null,
    },
    returnDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Index for search
bookSchema.index({ title: "text" });

const Book = mongoose.model("Book", bookSchema);
export default Book;