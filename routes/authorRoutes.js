import { Router } from "express";
import {
  getAuthors,
  getAuthor,
  createAuthor,
  updateAuthor,
  deleteAuthor,
} from "../controllers/authorController.js";
import { validateAuthor, validateMongoId } from "../middleware/validators.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.route("/").get(getAuthors).post(protect, validateAuthor, createAuthor);

router
  .route("/:id")
  .get(validateMongoId, getAuthor)
  .put(protect, validateMongoId, validateAuthor, updateAuthor)
  .delete(protect, validateMongoId, deleteAuthor);

export default router;