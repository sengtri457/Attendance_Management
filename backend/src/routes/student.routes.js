// ===================================
// routes/student.routes.js
// ===================================
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({dest: "uploads/"});
const studentController = require("../controllers/student.controller");
const {authMiddleware, roleCheck} = require("../middleware/auth");

router.post("/import", upload.single("file"), studentController.importStudents);

router.get("/blacklisted", authMiddleware, studentController.getBlacklistedStudents);
router.get("/", authMiddleware, studentController.getAllStudents);
router.get("/:id", authMiddleware, studentController.getStudentById);
router.post("/",
// authMiddleware,
// roleCheck("Admin"),
studentController.createStudent);

router.put("/restore/:id", studentController.restoreStudent);
router.put("/:id", authMiddleware, studentController.updateStudent);
router.delete("/:id", authMiddleware, roleCheck("Admin"), studentController.deleteStudent);

router.get("/:id/parents", authMiddleware, studentController.getStudentParents);

module.exports = router;
