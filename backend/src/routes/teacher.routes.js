// ===================================
// routes/teacher.routes.js
// ===================================
const express = require("express");
const router = express.Router();
const teacherController = require("../controllers/teacher.controller");
const { authMiddleware, roleCheck } = require("../middleware/auth");

router.get("/", authMiddleware, teacherController.getAllTeachers);
router.get("/:id", authMiddleware, teacherController.getTeacherById);
router.post(
  "/",
  authMiddleware,
  roleCheck("Admin"),
  teacherController.createTeacher,
);
router.put("/:id", authMiddleware, teacherController.updateTeacher);
router.get(
  "/:id/subjects",
  authMiddleware,
  teacherController.getTeacherSubjects,
);

module.exports = router;
