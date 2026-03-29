import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const attendantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Attendant name is required"],
      trim: true,
    },
    staffId: {
      type: String,
      required: [true, "Staff ID is required"],
      unique: true,
      trim: true,
    },
    // For JWT auth login
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Hash password before saving
attendantSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
attendantSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const LibraryAttendant = mongoose.model("LibraryAttendant", attendantSchema);
export default LibraryAttendant;