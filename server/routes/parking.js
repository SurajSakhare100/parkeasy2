import express from "express";
import { 
  getAllParkings, 
  getNearParkings,
  searchParkings,
  getOwnerParkings,
  updateParking,
  deleteParking,
  createParking
} from "../controllers/parkingController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Get all parking spots
router.get("/", getAllParkings);

// Get parking spots near a location
router.get("/near", getNearParkings);

// Search parking spots
router.get("/search", searchParkings);

// Owner routes
router.get("/owner", protect, getOwnerParkings);
router.post("/", protect, createParking);
router.put("/:id", protect, updateParking);
router.delete("/:id", protect, deleteParking);

export default router;
