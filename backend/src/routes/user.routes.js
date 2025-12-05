// ===================================
// routes/user.routes.js
// ===================================
const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { authMiddleware, roleCheck } = require("../middleware/auth");

router.get("/", authMiddleware, roleCheck("Admin"), userController.getAllUsers);
router.get("/:id", authMiddleware, userController.getUserById);
router.post("/", authMiddleware, roleCheck("Admin"), userController.createUser);
router.put(
  "/:id",
  authMiddleware,
  roleCheck("Admin"),
  userController.updateUser,
);
router.delete(
  "/:id",
  authMiddleware,
  roleCheck("Admin"),
  userController.deleteUser,
);
router.patch(
  "/:id/toggle-status",
  authMiddleware,
  roleCheck("Admin"),
  userController.toggleUserStatus,
);
router.patch(
  "/:id/change-password",
  authMiddleware,
  userController.changePassword,
);

module.exports = router;
