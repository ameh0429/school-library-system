import { Router } from "express";
import {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  borrowBook,
  returnBook,
} from "../controllers/bookController.js";
import {
  validateBook,
  validateBorrow,
  validateMongoId,
} from "../middleware/validators.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.route("/").get(getBooks).post(protect, validateBook, createBook);

router
  .route("/:id")
  .get(validateMongoId, getBook)
  .put(protect, validateMongoId, validateBook, updateBook)
  .delete(protect, validateMongoId, deleteBook);

// Borrow & Return — protected actions
router.post("/:id/borrow", protect, validateMongoId, validateBorrow, borrowBook);
router.post("/:id/return", protect, validateMongoId, returnBook);

export default router;