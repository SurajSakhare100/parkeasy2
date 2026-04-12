import mongoose from "mongoose";
import dotenv from "dotenv";
import Parking from "./models/Parking.js";
import User from "./models/User.js";

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Create a dummy owner if not exists
    let user = await User.findOne({ phone: "1234567890" });
    if (!user) {
      user = await User.create({
        name: "Demo Owner",
        phone: "1234567890",
        role: "owner"
      });
    }

    const parkingSpots = [
      {
        ownerId: user._id,
        name: "Alandi Temple Parking",
        location: { type: "Point", coordinates: [73.8875, 18.6750] },
        address: "Near Vitthal Rukmini Mandir, Alandi, Pune",
        totalSlots: 100,
        availableSlots: 45,
        pricePerHour: 20,
        vehicleType: ["car", "bike"],
      },
      {
        ownerId: user._id,
        name: "Baner Plaza Parking",
        location: { type: "Point", coordinates: [73.7799, 18.5597] },
        address: "Baner Rd, Laxman Nagar, Baner, Pune",
        totalSlots: 60,
        availableSlots: 12,
        pricePerHour: 30,
        vehicleType: ["car"],
      },
      {
        ownerId: user._id,
        name: "Shivajinagar Metro Parking",
        location: { type: "Point", coordinates: [73.8475, 18.5308] },
        address: "Shivaji Nagar Metro Station, Pune",
        totalSlots: 150,
        availableSlots: 85,
        pricePerHour: 15,
        vehicleType: ["car", "bike"],
      },
      {
        ownerId: user._id,
        name: "Phoenix Marketcity Parking",
        location: { type: "Point", coordinates: [73.9143, 18.5679] },
        address: "Viman Nagar, Pune",
        totalSlots: 200,
        availableSlots: 120,
        pricePerHour: 40,
        vehicleType: ["car", "bike"],
      },
      {
        ownerId: user._id,
        name: "Dighi Hills Parking",
        location: { type: "Point", coordinates: [73.8732, 18.6200] },
        address: "Dighi, Pune",
        totalSlots: 50,
        availableSlots: 20,
        pricePerHour: 15,
        vehicleType: ["car", "bike"],
      },
      {
        ownerId: user._id,
        name: "Old Sangvi Public Parking",
        location: { type: "Point", coordinates: [73.8054, 18.5818] },
        address: "Old Sangvi, Pune",
        totalSlots: 80,
        availableSlots: 35,
        pricePerHour: 20,
        vehicleType: ["bike"],
      },
      {
        ownerId: user._id,
        name: "Pimpri Chinchwad Mall Parking",
        location: { type: "Point", coordinates: [73.7997, 18.6298] },
        address: "PCMC, Pimpri, Pune",
        totalSlots: 300,
        availableSlots: 150,
        pricePerHour: 50,
        vehicleType: ["car", "bike"],
      },
      {
        ownerId: user._id,
        name: "Wakad Bridge Parking",
        location: { type: "Point", coordinates: [73.7652, 18.5987] },
        address: "Wakad Rd, Wakad, Pune",
        totalSlots: 120,
        availableSlots: 40,
        pricePerHour: 25,
        vehicleType: ["car"],
      }
    ];

    await Parking.deleteMany({});
    await Parking.insertMany(parkingSpots);
    
    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();
