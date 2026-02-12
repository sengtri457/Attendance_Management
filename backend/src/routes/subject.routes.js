// ===================================
// routes/subject.routes.js
// ===================================
const express = require("express");
const router = express.Router();
const subjectController = require("../controllers/subject.controller");
const {authMiddleware, roleCheck} = require("../middleware/auth");

router.get("/schedule", authMiddleware, subjectController.getSubjectSchedule);
router.get("/", authMiddleware, subjectController.getAllSubjects);
router.get("/:id", authMiddleware, subjectController.getSubjectById);
router.post("/", authMiddleware, roleCheck("Admin", "Teacher"), subjectController.createSubject,);
router.put("/:id", authMiddleware, roleCheck("Admin", "Teacher"), subjectController.updateSubject,);
router.delete("/:id", authMiddleware, roleCheck("Admin"), subjectController.deleteSubject,);
router.get("/teacher/:teacherId", authMiddleware, subjectController.getSubjectsByTeacher,);

module.exports = router;
