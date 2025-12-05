const express = require("express");
const router = express.Router();
const controller = require("../controllers/parentStudent.controller");
const { authMiddleware, roleCheck } = require("../middleware/auth");

router.post("/", authMiddleware, controller.createParentStudent);
router.get("/", authMiddleware, controller.getAllParentStudents);
router.get("/:id", authMiddleware, controller.getParentStudentById);
router.delete("/:id", authMiddleware, controller.deleteParentStudent);

module.exports = router;
