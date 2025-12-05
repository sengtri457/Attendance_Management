// ===================================
// controllers/leaveRequest.controller.js
// ===================================
const LeaveRequest = require("../models/LeaveRequest");

exports.getLeaveRequests = async (req, res) => {
  try {
    const { studentId, status } = req.query;

    let query = {};

    if (studentId) {
      query.student = studentId;
    }

    if (status) {
      query.status = status;
    }

    const requests = await LeaveRequest.find(query)
      .populate("student", "firstName lastName")
      .populate("reviewedBy", "username")
      .sort({ requestedAt: -1 });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leave requests",
    });
  }
};

exports.createLeaveRequest = async (req, res) => {
  try {
    const { studentId, fromDate, toDate, reason } = req.body;

    const leaveRequest = new LeaveRequest({
      student: studentId,
      fromDate,
      toDate,
      reason,
    });

    await leaveRequest.save();

    res.status(201).json({
      success: true,
      message: "Leave request submitted successfully",
      data: { leaveId: leaveRequest._id },
    });
  } catch (error) {
    console.error("Error creating leave request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit leave request",
    });
  }
};

exports.reviewLeaveRequest = async (req, res) => {
  try {
    const { status, reviewedById } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be approved or rejected",
      });
    }

    const leaveRequest = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      {
        status,
        reviewedBy: reviewedById,
        reviewedAt: new Date(),
      },
      { new: true },
    );

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    res.json({
      success: true,
      message: `Leave request ${status} successfully`,
      data: leaveRequest,
    });
  } catch (error) {
    console.error("Error reviewing leave request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to review leave request",
    });
  }
};
// Delete leave request
exports.deleteLeaveRequest = async (req, res) => {
  try {
    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    // Prevent deletion of approved leaves
    if (leaveRequest.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete approved leave requests",
      });
    }

    await leaveRequest.deleteOne();

    res.json({
      success: true,
      message: "Leave request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting leave request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete leave request",
    });
  }
};

// Get leave request summary for a student
exports.getLeaveRequestSummary = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { year } = req.query;

    const currentYear = year || new Date().getFullYear();
    const startDate = new Date(`${currentYear}-01-01`);
    const endDate = new Date(`${currentYear}-12-31`);

    const requests = await LeaveRequest.find({
      student: studentId,
      fromDate: { $gte: startDate },
      toDate: { $lte: endDate },
    });

    const summary = {
      total: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
      totalDaysApproved: 0,
    };

    // Calculate total approved days
    requests
      .filter((r) => r.status === "approved")
      .forEach((r) => {
        const days =
          Math.ceil(
            (new Date(r.toDate) - new Date(r.fromDate)) / (1000 * 60 * 60 * 24),
          ) + 1;
        summary.totalDaysApproved += days;
      });

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error fetching leave summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leave summary",
    });
  }
};
