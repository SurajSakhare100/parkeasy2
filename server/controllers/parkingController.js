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
 * Search parking spots by name / address with optional filters:
 *   q           - text query (name or address)
 *   sortBy      - price_asc | price_desc | slots | distance (default: none)
 *   maxPrice    - max pricePerHour (number)
 *   vehicleType - car | bike
 *   availableOnly - true → only spots with availableSlots > 0
 */
export const searchParkings = async (req, res) => {
  try {
    const { q, sortBy, maxPrice, vehicleType, availableOnly } = req.query;

    // Build base filter
    const filter = { isActive: true };

    // Text search (name or address)
    if (q && q.trim() !== "") {
      const regex = new RegExp(q.trim(), "i");
      filter.$or = [
        { name: { $regex: regex } },
        { address: { $regex: regex } },
      ];
    }

    // Price ceiling
    if (maxPrice) {
      filter.pricePerHour = { $lte: parseFloat(maxPrice) };
    }

    // Vehicle type
    if (vehicleType && vehicleType !== "all") {
      filter.vehicleType = vehicleType;
    }

    // Available slots only
    if (availableOnly === "true") {
      filter.availableSlots = { $gt: 0 };
    }

    // Sort mapping
    let sortOption = {};
    if (sortBy === "price_asc")  sortOption = { pricePerHour: 1 };
    if (sortBy === "price_desc") sortOption = { pricePerHour: -1 };
    if (sortBy === "slots")      sortOption = { availableSlots: -1 };
    // distance sort requires $geoNear — handled client-side for now

    const parkings = await Parking.find(filter).sort(sortOption);
    res.status(200).json(parkings);
  } catch (error) {
    console.error("Search parkings error:", error);
    res.status(500).json({
      message: "Server Error while searching parkings",
      error: error.message,
    });
  }
};

/**
 * Get parkings for the logged in owner
 */
export const getOwnerParkings = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const parkings = await Parking.find({ ownerId });
    res.status(200).json(parkings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching owner parkings" });
  }
};

/**
 * Update a parking spot
 */
export const updateParking = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;

    const parking = await Parking.findOneAndUpdate(
      { _id: id, ownerId },
      { $set: req.body },
      { returnDocument: 'after', runValidators: true }
    );

    if (!parking) return res.status(404).json({ message: "Parking not found or unauthorized" });

    res.status(200).json(parking);
  } catch (error) {
    console.error("Update parking error:", error);
    res.status(500).json({ message: "Error updating parking", error: error.message });
  }
};

/**
 * Delete a parking spot
 */
export const deleteParking = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { id } = req.params;

    const parking = await Parking.findOneAndDelete({ _id: id, ownerId });
    if (!parking) return res.status(404).json({ message: "Parking not found or unauthorized" });

    res.status(200).json({ message: "Parking deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting parking" });
  }
};

/**
 * Create a parking spot
 */
export const createParking = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const { name, address, description, location, totalSlots, pricePerHour, vehicleType, spots, startTime, endTime, images } = req.body;

    const newParking = new Parking({
      ownerId,
      name,
      address,
      description,
      location,
      totalSlots,
      availableSlots: totalSlots,
      pricePerHour,
      vehicleType,
      spots,
      startTime,
      endTime,
      images
    });

    const savedParking = await newParking.save();
    res.status(201).json(savedParking);
  } catch (error) {
    console.error("Create parking error:", error);
    res.status(500).json({ message: "Error creating parking", error: error.message });
  }
};
