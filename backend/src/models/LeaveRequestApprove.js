const mongoose = require("mongoose");

const leaveRequestApproveSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    leaveType: {
      type: String,
      enum: ["sick", "casual", "emergency", "personal", "other"],
      default: "casual",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
leaveRequestApproveSchema.index({ student: 1, status: 1 });
leaveRequestApproveSchema.index({ fromDate: 1, toDate: 1 });

// Virtual for number of days
leaveRequestApproveSchema.virtual("numberOfDays").get(function () {
  const from = moment(this.fromDate).startOf("day");
  const to = moment(this.toDate).startOf("day");
  return to.diff(from, "days") + 1;
});

// Ensure virtuals are included in JSON
leaveRequestApproveSchema.set("toJSON", { virtuals: true });
leaveRequestApproveSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model(
  "LeaveRequestApprove",
  leaveRequestApproveSchema,
);
