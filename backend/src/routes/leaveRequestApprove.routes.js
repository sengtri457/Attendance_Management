// const express = require("express");
// const router = express.Router();
// const {
//   getLeaveRequestsApprove,
//   createLeaveRequest,
//   updateLeaveStatus,
//   getLeaveRequest,
//   deleteLeaveRequest,
// } = require("../controllers/leaveRequestApprove.controller");

// // Middleware imports (adjust based on your project structure)
// const { authMiddleware, roleCheck } = require("../middleware/auth");

// // Get all leave requests (Teachers/Admins can see all, Students see only their own)
// router.get("/", authMiddleware, getLeaveRequestsApprove);

// // Get single leave request
// router.get("/:id", authMiddleware, getLeaveRequest);

// // Create new leave request (Students)
// router.post("/", authMiddleware, createLeaveRequest);

// // Approve or reject leave request (Teachers/Admins only)
// router.patch(
//   "/:id/status",
//   authMiddleware,
//   roleCheck("teacher", "admin"),
//   updateLeaveStatus,
// );

// // Delete/cancel leave request
// router.delete("/:id", authMiddleware, deleteLeaveRequest);

// module.exports = router;
