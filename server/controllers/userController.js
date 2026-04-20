import User from "../models/User.js";
import SearchHistory from "../models/SearchHistory.js";

/**
 * Get the current user's profile
 */
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Toggle a parking spot in user's saved list
 */
export const toggleSavedParking = async (req, res) => {
  try {
    const { parkingId } = req.params;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isSaved = user.savedParkings.includes(parkingId);

    if (isSaved) {
      user.savedParkings.pull(parkingId);
    } else {
      user.savedParkings.push(parkingId);
    }

    await user.save();
    
    // Return updated list format
    const updatedUser = await User.findById(userId).populate("savedParkings");

    res.status(200).json({
      message: isSaved ? "Parking removed from saved" : "Parking saved successfully",
      savedParkings: updatedUser.savedParkings,
    });
  } catch (error) {
    console.error("Toggle saved parking error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get user's saved parking spots
 */
export const getSavedParkings = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate({
      path: "savedParkings",
      match: { isActive: true }
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.savedParkings);
  } catch (error) {
    console.error("Get saved parkings error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get user's search history
 */
export const getSearchHistory = async (req, res) => {
  try {
    const history = await SearchHistory.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(10);
    res.status(200).json(history);
  } catch (error) {
    console.error("Get search history error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Add a query to search history
 */
export const addSearchHistory = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ message: "Query is required" });

    // Avoid duplicate adjacent searches or just save all
    const lastSearch = await SearchHistory.findOne({ userId: req.user.userId }).sort({ createdAt: -1 });
    if (lastSearch && lastSearch.query === query) {
      return res.status(200).json(lastSearch);
    }

    const newHistory = new SearchHistory({
      userId: req.user.userId,
      query,
    });
    await newHistory.save();

    res.status(201).json(newHistory);
  } catch (error) {
    console.error("Add search history error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
