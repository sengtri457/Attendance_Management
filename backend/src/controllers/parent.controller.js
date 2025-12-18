// ===================================
// controllers/parent.controller.js
// ===================================
const Parent = require("../models/Parent");
const ParentStudent = require("../models/ParentStudent");
const Student = require("../models/Student");
exports.getAllParents = async (req, res) => {
  try {
    // Extract query parameters
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "createdAt",
      sortOrder = "desc",
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
      ];
    }

    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with pagination
    const [parents, totalCount] = await Promise.all([
      Parent.find(searchQuery)
        .populate("user", "username email isActive")
        .populate({
          path: "student",
          select:
            "firstName lastName dob gender phone photo isBlacklisted user",
          populate: {
            path: "user",
            select: "username email role",
          },
        })
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Parent.countDocuments(searchQuery),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: parents,
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
    console.error("Error fetching parents:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch parents",
    });
  }
};

exports.getParentById = async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.id)
      .populate("user", "username email isActive")
      .populate({
        path: "student",
        populate: { path: "user", select: "username email role" }, // optional
      });

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    res.json({
      success: true,
      data: parent,
    });
  } catch (error) {
    console.error("Error fetching parent:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch parent",
    });
  }
};

exports.createParent = async (req, res) => {
  try {
    const { userId, name, phone, studentId } = req.body;

    const parent = new Parent({
      student: studentId,
      user: userId,
      name,
      phone,
    });

    await parent.save();

    const parentResponse = await Parent.findById(parent._id).populate(
      "user",
      "username email",
    );

    res.status(201).json({
      success: true,
      message: "Parent created successfully",
      data: parentResponse,
    });
  } catch (error) {
    console.error("Error creating parent:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create parent",
    });
  }
};

exports.updateParent = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const parent = await Parent.findByIdAndUpdate(
      req.params.id,
      { name, phone },
      { new: true },
    ).populate("user", "username email");

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    res.json({
      success: true,
      message: "Parent updated successfully",
      data: parent,
    });
  } catch (error) {
    console.error("Error updating parent:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update parent",
    });
  }
};

exports.deleteParent = async (req, res) => {
  try {
    // Check if parent has any children
    const childrenCount = await ParentStudent.countDocuments({
      parent: req.params.id,
    });

    if (childrenCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete parent. They have ${childrenCount} child(ren) linked. Remove relationships first.`,
      });
    }

    const parent = await Parent.findByIdAndDelete(req.params.id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    res.json({
      success: true,
      message: "Parent deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting parent:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete parent",
    });
  }
};

exports.getParentChildren = async (req, res) => {
  try {
    const relationships = await ParentStudent.find({
      parent: req.params.id,
    }).populate({
      path: "student",
      populate: { path: "user", select: "username email" },
    });

    const children = relationships.map((rel) => ({
      ...rel.student.toObject(),
      relationshipCreated: rel.createdAt,
    }));

    res.json({
      success: true,
      data: children,
      count: children.length,
    });
  } catch (error) {
    console.error("Error fetching parent children:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch children",
    });
  }
};

exports.addChild = async (req, res) => {
  try {
    const { studentId } = req.body;
    const parentId = req.params.id;

    // Check if parent exists
    const parent = await Parent.findById(parentId);
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Check if relationship already exists
    const existing = await ParentStudent.findOne({
      parent: parentId,
      student: studentId,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "This parent-child relationship already exists",
      });
    }

    const parentStudent = new ParentStudent({
      parent: parentId,
      student: studentId,
    });

    await parentStudent.save();

    res.status(201).json({
      success: true,
      message: "Child added to parent successfully",
      data: parentStudent,
    });
  } catch (error) {
    console.error("Error adding child:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add child",
    });
  }
};

exports.removeChild = async (req, res) => {
  try {
    const { studentId } = req.params;
    const parentId = req.params.id;

    const relationship = await ParentStudent.findOneAndDelete({
      parent: parentId,
      student: studentId,
    });

    if (!relationship) {
      return res.status(404).json({
        success: false,
        message: "Parent-child relationship not found",
      });
    }

    res.json({
      success: true,
      message: "Child removed from parent successfully",
    });
  } catch (error) {
    console.error("Error removing child:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove child",
    });
  }
};
