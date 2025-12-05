// ===================================
// controllers/role.controller.js
// ===================================
const Role = require("../models/Role");

exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ roleName: 1 });

    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch roles",
    });
  }
};

exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.json({
      success: true,
      data: role,
    });
  } catch (error) {
    console.error("Error fetching role:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch role",
    });
  }
};

exports.createRole = async (req, res) => {
  try {
    const { roleName, roleDescription } = req.body;

    const existing = await Role.findOne({ roleName });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Role name already exists",
      });
    }

    const role = new Role({
      roleName,
      roleDescription,
    });

    await role.save();

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: role,
    });
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create role",
    });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { roleName, roleDescription } = req.body;

    // Check if new role name already exists (excluding current role)
    if (roleName) {
      const existing = await Role.findOne({
        roleName,
        _id: { $ne: req.params.id },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Role name already exists",
        });
      }
    }

    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { roleName, roleDescription },
      { new: true },
    );

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.json({
      success: true,
      message: "Role updated successfully",
      data: role,
    });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update role",
    });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const User = require("../models/User");

    // Check if any users have this role
    const usersWithRole = await User.countDocuments({ role: req.params.id });

    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role`,
      });
    }

    const role = await Role.findByIdAndDelete(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete role",
    });
  }
};

exports.getRoleUsers = async (req, res) => {
  try {
    const User = require("../models/User");

    const users = await User.find({ role: req.params.id })
      .select("-password")
      .populate("role", "roleName");

    res.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error("Error fetching role users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users for this role",
    });
  }
};
