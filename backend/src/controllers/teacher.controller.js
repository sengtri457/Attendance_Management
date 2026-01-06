// ===================================
// controllers/teacher.controller.js
// ===================================
const Teacher = require("../models/Teacher");
const Subject = require("../models/Subject");

exports.getAllTeachers = async (req, res) => {
  try {
    // Extract query parameters
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;

    // Convert to numbers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build search query
    const searchQuery = {};

    // Add search conditions if search term exists
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { qualification: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with pagination
    const [teachers, totalCount] = await Promise.all([
      Teacher.find(searchQuery)
        .populate("user", "username email isActive")
        .populate("subject", "subjectName teachTime endTime")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Teacher.countDocuments(searchQuery),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: teachers,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPrevPage,
      },
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
    const { name, phone, subjectId } = req.body;

    // Validate input
    if (!name && !phone && !subjectId) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide at least one field to update (name, phone, or subject)",
      });
    }

    // Check if teacher exists
    const existingTeacher = await Teacher.findById(req.params.id);
    if (!existingTeacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // If phone is being updated, check for duplicates
    if (phone && phone !== existingTeacher.phone) {
      const duplicatePhone = await Teacher.findOne({
        phone,
        _id: { $ne: req.params.id },
      });

      if (duplicatePhone) {
        return res.status(400).json({
          success: false,
          message: "Phone number already in use by another teacher",
        });
      }
    }

    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;

    // If subject is being updated, verify subject exists
    if (subjectId) {
      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: "Subject not found",
        });
      }

      // Optional: Check if another teacher is already assigned to this subject
      if (subjectId !== existingTeacher.subject) {
        const subjectTaken = await Teacher.findOne({
          subject: subjectId,
          _id: { $ne: req.params.id },
        });

        if (subjectTaken) {
          return res.status(400).json({
            success: false,
            message: "This subject is already assigned to another teacher",
          });
        }
      }

      updateData.subject = subjectId;
    }

    // Update teacher
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("subject", "subjectName subjectCode credit dayOfWeek")
      .populate("user", "username email");

    res.json({
      success: true,
      message: "Teacher updated successfully",
      data: teacher,
    });
  } catch (error) {
    console.error("Error updating teacher:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate value provided",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update teacher",
      error: error.message,
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

exports.deletedTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }
    res.json({
      success: true,
      message: "Teacher deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete teacher",
    });
  }
};
