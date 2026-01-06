// ===================================
// controllers/auth.controller.js
// ===================================
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Parent = require("../models/Parent");

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username }).populate("role");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }
    // 🎯 GET ROLE-SPECIFIC IDS
    let studentId = null;
    let teacherId = null;
    let parentId = null;

    if (user.role.roleName === "Student") {
      const student = await Student.findOne({ user: user._id });
      studentId = student?._id;
    } else if (user.role.roleName === "Teacher") {
      const teacher = await Teacher.findOne({ user: user._id });
      teacherId = teacher?._id;
    } else if (user.role.roleName === "Parent") {
      const parent = await Parent.findOne({ user: user._id });
      parentId = parent?._id;
    }

    const tokens = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role.roleName,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "30D" }
    );

    res.json({
      success: true,
      data: {
        tokens,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role.roleName,
          studentId, // ✅ ADDED
          teacherId, // ✅ ADDED
          parentId, // ✅ ADDED
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

exports.register = async (req, res) => {
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

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { userId: user._id },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};
