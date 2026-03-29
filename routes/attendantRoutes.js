import { Router } from "express";
import {
  loginAttendant,
  getAttendants,
  getAttendant,
  createAttendant,
  updateAttendant,
  deleteAttendant,
} from "../controllers/attendantController.js";
import {
  validateAttendant,
  validateMongoId,
  validateLogin,
} from "../middleware/validators.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Auth
router.post("/login", validateLogin, loginAttendant);

router
  .route("/")
  .get(protect, getAttendants)
  .post(protect, validateAttendant, createAttendant);

router
  .route("/:id")
  .get(protect, validateMongoId, getAttendant)
  .put(protect, validateMongoId, updateAttendant)
  .delete(protect, validateMongoId, deleteAttendant);

export default router;