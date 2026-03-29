import { Router } from "express";
import {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../controllers/studentController.js";
import { validateStudent, validateMongoId } from "../middleware/validators.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router
  .route("/")
  .get(protect, getStudents)
  .post(protect, validateStudent, createStudent);

router
  .route("/:id")
  .get(protect, validateMongoId, getStudent)
  .put(protect, validateMongoId, validateStudent, updateStudent)
  .delete(protect, validateMongoId, deleteStudent);

export default router;