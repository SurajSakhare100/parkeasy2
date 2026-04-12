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
