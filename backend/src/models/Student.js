const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    parentStudent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Parent"
    },
    classGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClassGroup"
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    dob: {
        type: Date
    },
    gender: {
        type: String,
        enum: ["male", "female", "other"]
    },
    phone: {
        type: String,
        trim: true
    },
    photo: {
        type: String
    },
    isBlacklisted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
},);
module.exports = mongoose.model("Student", studentSchema);
