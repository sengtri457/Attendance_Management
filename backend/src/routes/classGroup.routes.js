const express = require("express");
const router = express.Router();
const {
    createClassGroup,
    getAllClassGroups,
    getClassGroupById,
    updateClassGroup,
    deleteClassGroup
} = require("../controllers/classGroup.controller");

// Base route: /api/class-groups

router.post("/", createClassGroup);
router.get("/", getAllClassGroups);
router.get("/:id", getClassGroupById);
router.put("/:id", updateClassGroup);
router.delete("/:id", deleteClassGroup);

module.exports = router;
