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
        },
      ];

      if (Object.keys(sortOption).length) agg.push({ $sort: sortOption });

      // limit to a reasonable number to keep payload small
      agg.push({ $limit: 200 });

      parkings = await Parking.aggregate(agg);

      // normalize fields to match .lean() output and add distance fields
      parkings = parkings.map(p => {
        if (p.dist && typeof p.dist.calculated === 'number') {
          p.distanceKm = Number(p.dist.calculated.toFixed(2));
          p.distanceText = p.distanceKm < 1 ? '<1 km' : `${Math.round(p.distanceKm)} km away`;
        }
        return p;
      });
    } else {
      parkings = await Parking.find(filter).sort(sortOption).lean();
    }
    const scriptPath = path.join(__dirname, "../scripts/recommend_parkings.py");
    const payload = JSON.stringify({
      parkings,
      query: q,
      filters: { sortBy, maxPrice, vehicleType, availableOnly },
    });

    // Use spawn and stream stdin/stdout to avoid compatibility issues with execFile options
    const { spawn } = await import('child_process');
    const py = spawn(process.env.PYTHON_PATH || 'python3', [scriptPath]);

    let stdout = '';
    let stderr = '';

    py.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    py.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    py.on('error', (err) => {
      console.error('Recommend parking spawn error:', err);
      return res.status(500).json({ message: 'Recommendation engine failed', error: err.message });
    });

    py.on('close', (code) => {
      if (code !== 0) {
        console.error('Recommend parking script exited with code', code, stderr);
        return res.status(500).json({ message: 'Recommendation engine failed', error: stderr || `exit code ${code}` });
      }

      try {
        const recommendationResult = JSON.parse(stdout);

        // Attach distance information if user coordinates are provided
        const userLat = parseFloat(req.query.lat);
        const userLng = parseFloat(req.query.lng);
        const hasUserCoords = !Number.isNaN(userLat) && !Number.isNaN(userLng);

        if (Array.isArray(recommendationResult.parkings) && hasUserCoords) {
          // Basic haversine fallback for all items first
          recommendationResult.parkings = recommendationResult.parkings.map((p) => {
            try {
              const coords = p.location && p.location.coordinates;
              if (Array.isArray(coords) && coords.length >= 2) {
                const lon = Number(coords[0]);
                const lat = Number(coords[1]);
                if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
                  const d = haversineKm(userLat, userLng, lat, lon);
                  p.distanceKm = Number(d.toFixed(2));
                  p.distanceText = d < 1 ? '<1 km' : `${Math.round(d)} km away`;
                }
              }
            } catch (e) {
              // ignore per-item distance errors
            }
            return p;
          });

          // Try to enrich with Google Distance Matrix (driving distance) if key present
          const apiKey = process.env.GOOGLE_MAPS_API_KEY;
          if (apiKey && recommendationResult.parkings.length > 0) {
            (async () => {
              try {
                // limit destinations to 25 to stay within common API limits
                const maxDests = 25;
                const dests = recommendationResult.parkings.slice(0, maxDests).map((p) => {
                  const c = p.location && p.location.coordinates;
                  return `${(c && c[1]) || ''},${(c && c[0]) || ''}`; // lat,lon
                }).join('|');

                const origin = `${userLat},${userLng}`;
                const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(dests)}&key=${encodeURIComponent(apiKey)}`;

                const resp = await fetch(url);
                if (!resp.ok) throw new Error(`Distance matrix HTTP ${resp.status}`);
                const dm = await resp.json();
                if (dm && dm.rows && dm.rows[0] && Array.isArray(dm.rows[0].elements)) {
                  const elements = dm.rows[0].elements;
                  for (let i = 0; i < elements.length; i++) {
                    const el = elements[i];
                    const p = recommendationResult.parkings[i];
                    if (!p) continue;
                    if (el && el.status === 'OK' && el.distance) {
                      p.distanceKm = Number((el.distance.value / 1000).toFixed(2));
                      p.distanceText = el.distance.text; // e.g. '13 km'
                    }
                  }

                  // also update recommendedParking if it's within the first N
                  if (recommendationResult.recommendedParking && recommendationResult.recommendedParking.location && recommendationResult.recommendedParking.location.coordinates) {
                    const rc = recommendationResult.recommendedParking.location.coordinates;
                    const rlat = Number(rc[1]);
                    const rlon = Number(rc[0]);
                    // find index in sliced array
                    const idx = recommendationResult.parkings.findIndex(p => p._id === recommendationResult.recommendedParking._id);
                    if (idx >= 0 && idx < elements.length) {
                      const el = elements[idx];
                      if (el && el.status === 'OK' && el.distance) {
                        recommendationResult.recommendedParking.distanceKm = Number((el.distance.value / 1000).toFixed(2));
                        recommendationResult.recommendedParking.distanceText = el.distance.text;
                      }
                    }
                  }
                }
              } catch (e) {
                console.warn('Google Distance Matrix enrichment failed:', e.message);
                // keep haversine distances as fallback
              }
            })();
          }
        }

        res.status(200).json(recommendationResult);
      } catch (parseError) {
        console.error('Recommendation parse error:', parseError, 'stdout:', stdout);
        res.status(500).json({ message: 'Invalid recommendation response', error: parseError.message });
      }
    });

    // send payload
    try {
      py.stdin.write(payload);
      py.stdin.end();
    } catch (e) {
      console.error('Error writing to python stdin:', e);
    }
  } catch (error) {
    console.error("Recommend parkings error:", error);
    res.status(500).json({
      message: "Server Error while recommending parkings",
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
