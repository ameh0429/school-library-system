import { body, param, query, validationResult } from "express-validator";

// Reusable validation error handler
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// --- Author Validators ---
export const validateAuthor = [
  body("name").trim().notEmpty().withMessage("Author name is required"),
  body("bio").optional().trim(),
  validate,
];

// --- Book Validators ---
export const validateBook = [
  body("title").trim().notEmpty().withMessage("Book title is required"),
  body("isbn").optional().trim(),
  body("authors")
    .optional()
    .isArray()
    .withMessage("Authors must be an array of IDs"),
  body("authors.*")
    .optional()
    .isMongoId()
    .withMessage("Each author must be a valid MongoDB ID"),
  validate,
];

// --- Student Validators ---
export const validateStudent = [
  body("name").trim().notEmpty().withMessage("Student name is required"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("studentId").trim().notEmpty().withMessage("Student ID is required"),
  validate,
];

// --- Attendant Validators ---
export const validateAttendant = [
  body("name").trim().notEmpty().withMessage("Attendant name is required"),
  body("staffId").trim().notEmpty().withMessage("Staff ID is required"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  validate,
];

// --- Borrow Validators ---
export const validateBorrow = [
  body("studentId")
    .trim()
    .notEmpty()
    .withMessage("studentId is required")
    .isMongoId()
    .withMessage("studentId must be a valid MongoDB ID"),
  body("attendantId")
    .trim()
    .notEmpty()
    .withMessage("attendantId is required")
    .isMongoId()
    .withMessage("attendantId must be a valid MongoDB ID"),
  body("returnDate")
    .notEmpty()
    .withMessage("returnDate is required")
    .isISO8601()
    .withMessage("returnDate must be a valid ISO 8601 date")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("returnDate must be a future date");
      }
      return true;
    }),
  validate,
];

// --- Auth Validators ---
export const validateLogin = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
];

// --- MongoId param validator ---
export const validateMongoId = [
  param("id").isMongoId().withMessage("Invalid ID format"),
  validate,
];