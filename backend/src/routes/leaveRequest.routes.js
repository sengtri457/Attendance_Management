// ===================================
// routes/leaveRequest.routes.js
// ===================================
const express = require("express");
const router = express.Router();
const leaveRequestController = require("../controllers/leaveRequest.controller");
const {authMiddleware, roleCheck} = require("../middleware/auth");

const upload = require("../middleware/upload");

router.get("/", authMiddleware, leaveRequestController.getLeaveRequests);
router.post("/", authMiddleware, upload.array("evidence"), leaveRequestController.createLeaveRequest);
router.put("/:id/review", authMiddleware, roleCheck("Admin", "Teacher"), leaveRequestController.reviewLeaveRequest);
router.get("/summary/:studentId", authMiddleware, leaveRequestController.getLeaveRequestSummary);

module.exports = router;
