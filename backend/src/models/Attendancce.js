const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        default: null
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    checkInTime: {
        type: Date,
        default: null
    },
    checkOutTime: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: [
            "present",
            "absent",
            "late",
            "half-day",
            "on-leave",
            "excused"
        ],
        default: "present"
    },
    isLate: {
        type: Boolean,
        default: false
    },
    lateBy: {
        type: Number, // Minutes late
        default: 0
    },
    workHours: {
        type: Number, // Total work hours
        default: 0
    },
    markedByTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
        required: true
    },
    note: {
        type: String,
        default: ""
    },
    leaveReference: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LeaveRequest",
        default: null
    }
}, {
    timestamps: true
},);
// Compound index for efficient queries - Update to include subject
attendanceSchema.index({
    student: 1,
    date: 1,
    subject: 1
}, {unique: true});
attendanceSchema.index({status: 1, date: 1});
attendanceSchema.index({isLate: 1, date: 1});

module.exports = mongoose.model("Attendance", attendanceSchema);
