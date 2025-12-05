const ParentStudent = require("../models/ParentStudent");
exports.createParentStudent = async (req, res) => {
  try {
    const { parent, student } = req.body;

    if (!parent || !student) {
      return res
        .status(400)
        .json({ message: "parent and student are required" });
    }

    const data = await ParentStudent.create({ parent, student });

    res.status(201).json({
      message: "ParentStudent created",
      data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllParentStudents = async (req, res) => {
  try {
    const list = await ParentStudent.find()
      .populate("parent")
      .populate("student");

    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getParentStudentById = async (req, res) => {
  try {
    const item = await ParentStudent.findById(req.params.id)
      .populate("parent")
      .populate("student");

    if (!item) {
      return res.status(404).json({ message: "ParentStudent not found" });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteParentStudent = async (req, res) => {
  try {
    const deleted = await ParentStudent.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "ParentStudent not found" });
    }

    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
