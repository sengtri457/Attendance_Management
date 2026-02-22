// ===================================
// routes/attendance.routes.js
// ===================================
const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendance.controller");
const {authMiddleware, roleCheck} = require("../middleware/auth");

// Basic CRUD
router.get("/", authMiddleware, attendanceController.getAttendance);
router.post("/", authMiddleware, roleCheck("Teacher", "Admin"), attendanceController.markAttendance,);
router.put("/:id", authMiddleware, roleCheck("Teacher", "Admin"), attendanceController.updateAttendance,);
router.delete("/:id", authMiddleware, roleCheck("Admin"), attendanceController.deleteAttendance,);

// Statistics & Reports
router.get("/stats/:studentId", authMiddleware, attendanceController.getStudentStats,);
router.get("/late-report", authMiddleware, roleCheck("Teacher", "Admin"), attendanceController.getLateReport,);
router.get("/absent-report", authMiddleware, roleCheck("Teacher", "Admin"), attendanceController.getAbsentReport,);
router.get("/today", authMiddleware, attendanceController.getTodayAttendance);

// Special operations
router.post("/mark-absent", authMiddleware, roleCheck("Admin", "Teacher"), attendanceController.markAbsent,);
router.post("/bulk", authMiddleware, roleCheck("Admin", "Teacher"), attendanceController.markBulkAttendance,);
// Add this route for checking leave status
router.get("/check-leave-status", authMiddleware, attendanceController.checkStudentLeaveStatus,);
// LeaveRequest ByID
router.get("/leave-request/:id", authMiddleware, attendanceController.getLeaveRequest,);

module.exports = router;
