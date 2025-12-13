// ===================================
// controllers/teacher.controller.js
// ===================================
const Teacher = require("../models/Teacher");
const Subject = require("../models/Subject");

exports.getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate("user", "username email isActive")
      .populate("subject", "subjectName teachTime endTime");

    res.json({
      success: true,
      data: teachers,
    });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch teachers",
    });
  }
};

exports.getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate(
      "user",
      "username email isActive"
    );

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    res.json({
      success: true,
      data: teacher,
    });
  } catch (error) {
    console.error("Error fetching teacher:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch teacher",
    });
  }
};
exports.createTeacher = async (req, res) => {
  try {
    const { subjectId, userId, name, phone } = req.body;

    const teacher = new Teacher({
      user: userId,
      name,
      phone,
      subject: subjectId, // Changed from subjectId to subject
    });

    await teacher.save();

    res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      data: { teacherId: teacher._id },
    });
  } catch (error) {
    console.error("Error creating teacher:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create teacher",
    });
  }
};

exports.updateTeacher = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      { name, phone },
      { new: true }
    );

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    res.json({
      success: true,
      message: "Teacher updated successfully",
      data: teacher,
    });
  } catch (error) {
    console.error("Error updating teacher:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update teacher",
    });
  }
};
exports.getTeacherSubjects = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate(
      "subject",
      "subjectName teachTime endTime"
    );

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    res.json({
      success: true,
      data: teacher.subject ? [teacher.subject] : [], // Return as array for consistency
    });
  } catch (error) {
    console.error("Error fetching teacher subject:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subject",
    });
  }
};
