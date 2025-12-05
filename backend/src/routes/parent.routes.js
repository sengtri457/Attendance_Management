// ===================================
// routes/parent.routes.js
// ===================================
const express = require("express");
const router = express.Router();
const parentController = require("../controllers/parent.controller");
const { authMiddleware, roleCheck } = require("../middleware/auth");

router.get("/", authMiddleware, parentController.getAllParents);
router.get("/:id", authMiddleware, parentController.getParentById);
router.post(
  "/",
  authMiddleware,
  roleCheck("Admin"),
  parentController.createParent,
);
router.put("/:id", authMiddleware, parentController.updateParent);
router.delete(
  "/:id",
  authMiddleware,
  roleCheck("Admin"),
  parentController.deleteParent,
);
router.get("/:id/children", authMiddleware, parentController.getParentChildren);
router.post(
  "/:id/children",
  authMiddleware,
  roleCheck("Admin"),
  parentController.addChild,
);
router.delete(
  "/:id/children/:studentId",
  authMiddleware,
  roleCheck("Admin"),
  parentController.removeChild,
);

module.exports = router;
