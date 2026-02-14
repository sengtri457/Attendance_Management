const mongoose = require("mongoose");

const classGroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
    },
    description: {
        type: String,
        trim: true
    },
    academicYear: {
        type: String, // e.g., "2025-2026"
        trim: true
    },
    homeroomTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher"
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {timestamps: true});

module.exports = mongoose.model("ClassGroup", classGroupSchema);
