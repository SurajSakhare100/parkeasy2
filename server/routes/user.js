import express from "express";
import {
  getUserProfile,
  toggleSavedParking,
  getSavedParkings,
  getSearchHistory,
  addSearchHistory,
  deleteSearchHistory,
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

// Search history
router.get("/search/history", getSearchHistory);
router.post("/search/history", addSearchHistory);
router.delete("/search/history/:historyId", deleteSearchHistory);

export default router;
