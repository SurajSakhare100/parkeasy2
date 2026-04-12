import express from "express";
import {
  getUserProfile,
  toggleSavedParking,
  getSavedParkings,
} from "../controllers/userController.js";
import { protect as authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Protect all user routes
router.use(authMiddleware);

// Profile
router.get("/profile", getUserProfile);

// Saved parkings
router.get("/saved", getSavedParkings);
router.post("/saved/:parkingId/toggle", toggleSavedParking);

export default router;
