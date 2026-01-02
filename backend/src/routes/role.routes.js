// ===================================
// routes/role.routes.js
// ===================================
const express = require("express");
const router = express.Router();
const roleController = require("../controllers/role.controller");
const { authMiddleware, roleCheck } = require("../middleware/auth");

router.get("/", roleController.getAllRoles);
router.get("/:id", authMiddleware, roleController.getRoleById);
router.post("/", roleController.createRole);
router.put(
  "/:id",
  authMiddleware,
  roleCheck("Admin"),
  roleController.updateRole
);
router.delete(
  "/:id",
  authMiddleware,
  roleCheck("Admin"),
  roleController.deleteRole
);
router.get(
  "/:id/users",
  authMiddleware,
  roleCheck("Admin"),
  roleController.getRoleUsers
);

module.exports = router;
