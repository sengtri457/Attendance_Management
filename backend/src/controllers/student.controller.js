// ===================================
// controllers/student.controller.js
// ===================================
const Student = require("../models/Student");
const ParentStudent = require("../models/ParentStudent");

exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find({ isBlacklisted: false })
      .populate("user", "username email")
      .populate("parentStudent", "name phone");

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch students",
    });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate("user", "username email isActive")
      .populate("parentStudent", "name phone");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student",
    });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const { userId, firstName, lastName, dob, gender, phone, photo, parentId } =
      req.body;

    const student = new Student({
      user: userId,
      firstName,
      lastName,
      dob,
      gender,
      phone,
      photo,
    });

    await student.save();

    if (parentId) {
      const parentStudent = new ParentStudent({
        parent: parentId,
        student: student._id,
      });
      await parentStudent.save();
    }

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: { studentId: student._id },
    });
  } catch (error) {
    console.error("Error creating student:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create student",
    });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { firstName, lastName, dob, gender, phone, photo } = req.body;

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, dob, gender, phone, photo },
      { new: true },
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      message: "Student updated successfully",
      data: student,
    });
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update student",
    });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { isBlacklisted: true },
      { new: true },
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      message: "Student blacklisted successfully",
    });
  } catch (error) {
    console.error("Error blacklisting student:", error);
    res.status(500).json({
      success: false,
      message: "Failed to blacklist student",
    });
  }
};
exports.getBlacklistedStudents = async (req, res) => {
  try {
    const students = await Student.find({ isBlacklisted: true })
      .populate("user", "username email")
      .populate("parentStudent", "name phone");

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error("Error fetching blacklisted students:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blacklisted students",
    });
  }
};
exports.restoreStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { isBlacklisted: false },
      { new: true },
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.json({
      success: true,
      message: "Student restored successfully",
      data: student,
    });
  } catch (error) {
    console.error("Error restoring student:", error);
    res.status(500).json({
      success: false,
      message: "Failed to restore student",
    });
  }
};

exports.getStudentParents = async (req, res) => {
  try {
    const relationships = await ParentStudent.find({
      student: req.params.id,
    }).populate({
      path: "parent",
      populate: { path: "user", select: "username email" },
    });

    const parents = relationships.map((rel) => rel.parent);

    res.json({
      success: true,
      data: parents,
    });
  } catch (error) {
    console.error("Error fetching student parents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch parents",
    });
  }
};
