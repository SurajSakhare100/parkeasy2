import mongoose from "mongoose";
import dotenv from "dotenv";
import Parking from "./models/Parking.js";

dotenv.config();

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const count = await Parking.countDocuments();
    console.log(`Parking spots count: ${count}`);
    const samples = await Parking.find().limit(2);
    console.log("Samples:", JSON.stringify(samples, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkData();
