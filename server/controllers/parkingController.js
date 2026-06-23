import Parking from "../models/Parking.js";
import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Haversine distance (km)
const toRad = (deg) => (deg * Math.PI) / 180;
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

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
    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "") {
      const priceLimit = parseFloat(maxPrice);
      if (!Number.isNaN(priceLimit)) {
        filter.pricePerHour = { $lte: priceLimit };
      }
    }

    // Vehicle type
    if (vehicleType && vehicleType !== "all") {
      filter.vehicleType = { $in: [vehicleType] };
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

    // If user coordinates provided, use MongoDB $geoNear to compute distances server-side
    const userLat = parseFloat(req.query.lat);
    const userLng = parseFloat(req.query.lng);
    const hasUserCoords = !Number.isNaN(userLat) && !Number.isNaN(userLng);

    let parkings;
    if (hasUserCoords) {
      const agg = [
        {
          $geoNear: {
            near: { type: "Point", coordinates: [userLng, userLat] },
            distanceField: "dist.calculated",
            spherical: true,
            query: filter,
            distanceMultiplier: 0.001 // return distance in kilometers
          }
        }
      ];

      if (Object.keys(sortOption).length) agg.push({ $sort: sortOption });
      agg.push({ $limit: 200 });

      parkings = await Parking.aggregate(agg);
      parkings = parkings.map(p => {
        if (p.dist && typeof p.dist.calculated === 'number') {
          p.distanceKm = Number(p.dist.calculated.toFixed(2));
          p.distanceText = p.distanceKm < 1 ? '<1 km' : `${Math.round(p.distanceKm)} km away`;
        }
        return p;
      });
    } else {
      parkings = await Parking.find(filter).sort(sortOption);
    }

    res.status(200).json(parkings);
  } catch (error) {
    console.error("Search parkings error:", error);
    res.status(500).json({
      message: "Server Error while searching parkings",
      error: error.message,
    });
  }
};

export const recommendParkings = async (req, res) => {
  try {
    const { q, sortBy, maxPrice, vehicleType, availableOnly } = req.query;

    const filter = { isActive: true };

    if (q && q.trim() !== "") {
      const regex = new RegExp(q.trim(), "i");
      filter.$or = [
        { name: { $regex: regex } },
        { address: { $regex: regex } },
      ];
    }

    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== "") {
      const priceLimit = parseFloat(maxPrice);
      if (!Number.isNaN(priceLimit)) {
        filter.pricePerHour = { $lte: priceLimit };
      }
    }

    if (vehicleType && vehicleType !== "all") {
      filter.vehicleType = { $in: [vehicleType] };
    }

    if (availableOnly === "true") {
      filter.availableSlots = { $gt: 0 };
    }

    let sortOption = {};

    if (sortBy === "price_asc") sortOption = { pricePerHour: 1 };
    if (sortBy === "price_desc") sortOption = { pricePerHour: -1 };
    if (sortBy === "slots") sortOption = { availableSlots: -1 };

    const userLat = parseFloat(req.query.lat);
    const userLng = parseFloat(req.query.lng);
    const hasUserCoords =
      !Number.isNaN(userLat) && !Number.isNaN(userLng);

    let parkings;

    if (hasUserCoords) {
      const pipeline = [
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [userLng, userLat],
            },
            distanceField: "distanceKm",
            spherical: true,
            distanceMultiplier: 0.001,
            query: filter,
          },
        },
      ];

      if (Object.keys(sortOption).length) {
        pipeline.push({ $sort: sortOption });
      }

      pipeline.push({ $limit: 200 });

      parkings = await Parking.aggregate(pipeline);

      parkings = parkings.map((parking) => ({
        ...parking,
        distanceKm: Number(parking.distanceKm.toFixed(2)),
        distanceText:
          parking.distanceKm < 1
            ? "<1 km"
            : `${Math.round(parking.distanceKm)} km away`,
      }));
    } else {
      parkings = await Parking.find(filter).sort(sortOption).lean();
    }

    res.status(200).json({
      success: true,
      count: parkings.length,
      parkings,
    });
  } catch (error) {
    console.error("Recommend parkings error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error while fetching parkings",
      error: error.message,
    });
  }
};

export const getOwnerParkings = async (req, res) => {
  try {
    const ownerId = req.user.userId;
    const parkings = await Parking.find({ ownerId });
    res.status(200).json(parkings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching owner parkings" });
  }
};


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
