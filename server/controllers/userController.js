import User from "../models/User.js";

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
