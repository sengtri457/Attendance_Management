// ===================================
// ===================================
// controllers/user.controller.js
// ===================================
const User = require("../models/User");
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("role", "roleName")

      // Student → ParentStudent → Parent → User
      .populate({
        path: "studentInfo",
        populate: [
          {
            path: "parentStudent",
            populate: [
              {
                path: "parent",
                populate: { path: "user", select: "email role" },
              },
              {
                path: "student",
                populate: { path: "user", select: "email role" },
              },
            ],
          },
        ],
      })

      // Parent → User (only works AFTER you add user field in Parent model)
      .populate({
        path: "parentInfo",
        populate: { path: "user", select: "email role" },
      })

      // Teacher → Subject + User
      .populate({
        path: "teacherInfo",
        populate: [
          { path: "subject", select: "name" },
          { path: "user", select: "email role" },
        ],
      })
      .lean();

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Could not load users",
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("role", "roleName roleDescription")
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, password, email, roleId } = req.body;

    const existing = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    const user = new User({
      username,
      password,
      email,
      role: roleId,
    });

    await user.save();

    const userResponse = await User.findById(user._id)
      .populate("role", "roleName")
      .select("-password");

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: userResponse,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { username, email, roleId, isActive } = req.body;

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (roleId) updateData.role = roleId;
    if (typeof isActive !== "undefined") updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    })
      .populate("role", "roleName")
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
    });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    const userResponse = await User.findById(user._id)
      .populate("role", "roleName")
      .select("-password");

    res.json({
      success: true,
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
      data: userResponse,
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle user status",
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.id;

    // Check if user is changing their own password or is admin
    if (req.user.userId !== userId && req.user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "You can only change your own password",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};
