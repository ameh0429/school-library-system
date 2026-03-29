import mongoose from "mongoose";

const authorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Author name is required"],
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const Author = mongoose.model("Author", authorSchema);
export default Author;