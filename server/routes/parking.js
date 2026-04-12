import express from "express";
import { 
  getAllParkings, 
  getNearParkings,
  searchParkings
} from "../controllers/parkingController.js";

const router = express.Router();

// Get all parking spots
router.get("/", getAllParkings);

// Get parking spots near a location
router.get("/near", getNearParkings);

// Search parking spots
router.get("/search", searchParkings);

export default router;
