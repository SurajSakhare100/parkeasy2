import Parking from "../models/Parking.js";

/**
 * Get all active parking spots
 */
export const getAllParkings = async (req, res) => {
  try {
    const parkings = await Parking.find({ isActive: true });
    res.status(200).json(parkings);
  } catch (error) {
    console.error("Get all parkings error:", error);
    res.status(500).json({ 
      message: "Server Error while fetching parkings", 
      error: error.message 
    });
  }
};

/**
 * Get parking spots near a specific coordinate
 */
export const getNearParkings = async (req, res) => {
  try {
    const { lng, lat, distance = 5000 } = req.query; // distance in meters

    if (!lng || !lat) {
      return res.status(400).json({ message: "Longitude and Latitude are required" });
    }

    const parkings = await Parking.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(distance),
        },
      },
      isActive: true,
    });
    
    res.status(200).json(parkings);
  } catch (error) {
    console.error("Get near parkings error:", error);
    res.status(500).json({ 
      message: "Server Error while fetching nearby parkings", 
      error: error.message 
    });
  }
};

/**
 * Search parking spots by name or address
 */
export const searchParkings = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === "") {
      return res.status(200).json([]);
    }

    const regex = new RegExp(q, "i");
    const parkings = await Parking.find({
      isActive: true,
      $or: [
        { name: { $regex: regex } },
        { locationText: { $regex: regex } }
      ]
    });
    
    res.status(200).json(parkings);
  } catch (error) {
    console.error("Search parkings error:", error);
    res.status(500).json({ 
      message: "Server Error while searching parkings", 
      error: error.message 
    });
  }
};
