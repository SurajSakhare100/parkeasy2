import mongoose from "mongoose";
import dotenv from "dotenv";
import crypto from "crypto";
import QRCode from "qrcode";
import Booking from "./models/Booking.js";
import Parking from "./models/Parking.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB");

        const parking = await Parking.findOne();
        if(!parking) {
            console.log("No parkings found to attach booking to.");
            process.exit(1);
        }

        const userId = "69db8ec027ccae5bc5c8d388";
        for(let i=0; i<4; i++) {
            const startTime = new Date();
            // Start times dynamically varied slightly to simulate real logic
            startTime.setHours(startTime.getHours() - (i*5)); 
            
            const durationHours = 2 + (i % 2); // alternates 2, 3, 2, 3
            const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000); 
            
            const totalAmount = parking.pricePerHour * durationHours;

            const qrToken = crypto.randomBytes(16).toString("hex");
            const qrPayload = JSON.stringify({
                token: qrToken,
                parkingId: parking._id,
                userId,
                startTime,
                endTime,
            });
            const qrCodeDataUrl = await QRCode.toDataURL(qrPayload);

            const statusToggle = i % 2 === 0 ? "completed" : "active";

            const booking = await Booking.create({
                userId,
                parkingId: parking._id,
                vehicleType: i % 2 === 0 ? "car" : "bike",
                startTime,
                endTime,
                totalAmount,
                qrCode: qrToken,
                qrCodeImage: qrCodeDataUrl,
                status: statusToggle,
                createdAt: startTime // override for mock realism in filters
            });

            console.log(`Booking ${i+1} Inserted:`, booking._id, "| Amount:", totalAmount);
        }

        console.log("-------------------");
        console.log("All 4 Dummy Bookings Inserted successfully!");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
