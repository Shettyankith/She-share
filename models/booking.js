const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post" 
    },
    checkInDate: {
        type: Date,
        required: true
    },
    checkOutDate: {
        type: Date,
        required: true
    },
    roomStatus: {
        type: String,
        enum: ["Available", "Booked"],
        default: "Available"
    }
});

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
