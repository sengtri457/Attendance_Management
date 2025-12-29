// ===================================
// routes/leaveRequest.routes.js
// ===================================
const express = require("express");
const router = express.Router();
const leaveRequestController = require("../controllers/leaveRequest.controller");
const { authMiddleware, roleCheck } = require("../middleware/auth");

router.get(
  "/",
  (req, res, next) => {
    console.log("🔍 GET /api/leave-requests hit!");
    console.log("User:", req.user);
    next();
  },
  leaveRequestController.getLeaveRequests
);
router.post("/", authMiddleware, leaveRequestController.createLeaveRequest);
router.put(
  "/:id/review",
  authMiddleware,
  roleCheck("Admin", "Teacher"),
  leaveRequestController.reviewLeaveRequest
);
router.get(
  "/summary/:studentId",
  authMiddleware,
  leaveRequestController.getLeaveRequestSummary
);

module.exports = router;
