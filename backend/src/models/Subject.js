const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
    subjectName: {
        type: String,
        required: true,
        trim: true
    },
    teachTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    description: {
        type: String,
        trim: true
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
        required: false
    },
    dayOfWeek: {
        type: String,
        enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
        ],
        required: false
    },
    credit: {
        type: Number,
        required: false,
        min: 1,
        max: 10
    },
    subjectCode: {
        type: String,
        required: false,
        trim: true
    },
    classGroup: { // Kept for backward compatibility
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClassGroup",
        required: false
    },
    classGroups: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ClassGroup"
        }
    ],
    sessions: [
        {
            days: [
                {
                    type: String,
                    enum: [
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                        "Sunday"
                    ]
                }
            ],
            dayOfWeek: { // Deprecated: kept for backward compatibility
                type: String,
                required: false
            },
            startTime: {
                type: String,
                required: true
            }, // Format HH:mm
            endTime: {
                type: String,
                required: true
            }, // Format HH:mm
            room: {
                type: String,
                required: false
            }
        }
    ]
}, {
    timestamps: true
},);

module.exports = mongoose.model("Subject", subjectSchema);
