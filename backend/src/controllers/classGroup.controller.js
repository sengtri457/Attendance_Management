const ClassGroup = require("../models/ClassGroup");
const Student = require("../models/Student");

// Create a new class group
exports.createClassGroup = async (req, res) => {
    try {
        const {name, description, academicYear, homeroomTeacher} = req.body;

        const existingClass = await ClassGroup.findOne({name});
        if (existingClass) {
            return res.status(400).json({success: false, message: "Class group with this name already exists"});
        }

        const classGroup = new ClassGroup({name, description, academicYear, homeroomTeacher});

        await classGroup.save();

        res.status(201).json({success: true, data: classGroup, message: "Class group created successfully"});
    } catch (error) {
        res.status(500).json({success: false, message: "Error creating class group", error: error.message});
    }
};

// Get all class groups
exports.getAllClassGroups = async (req, res) => {
    try {
        const classGroups = await ClassGroup.find().populate("homeroomTeacher", "name").sort({createdAt: -1});

        const data = await Promise.all(classGroups.map(async (group) => {
            const students = await Student.find({classGroup: group._id}).populate("user", "firstName lastName");
            return {
                ...group.toObject(),
                students
            };
        }));

        res.status(200).json({success: true, count: data.length, data});
    } catch (error) {
        res.status(500).json({success: false, message: "Error fetching class groups", error: error.message});
    }
};


// Get single class group by ID
exports.getClassGroupById = async (req, res) => {
    try {
        const classGroup = await ClassGroup.findById(req.params.id).populate("homeroomTeacher", "name").populate("student", "firstName");

        if (! classGroup) {
            return res.status(404).json({success: false, message: "Class group not found"});
        }

        // Optional: Get students in this class
        // We haven't updated Student model yet, but this will be useful later
        const students = await Student.find({classGroup: req.params.id}).populate("user", "email");

        res.status(200).json({
            success: true,
            data: {
                ... classGroup.toObject(),
                students
            }
        });
    } catch (error) {
        res.status(500).json({success: false, message: "Error fetching class group", error: error.message});
    }
};

// Update class group
exports.updateClassGroup = async (req, res) => {
    try {
        const classGroup = await ClassGroup.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (! classGroup) {
            return res.status(404).json({success: false, message: "Class group not found"});
        }

        res.status(200).json({success: true, data: classGroup, message: "Class group updated successfully"});
    } catch (error) {
        res.status(500).json({success: false, message: "Error updating class group", error: error.message});
    }
};

// Delete class group
exports.deleteClassGroup = async (req, res) => {
    try {
        const classGroup = await ClassGroup.findById(req.params.id);

        if (! classGroup) {
            return res.status(404).json({success: false, message: "Class group not found"});
        }

        await classGroup.deleteOne();

        res.status(200).json({success: true, message: "Class group deleted successfully"});
    } catch (error) {
        res.status(500).json({success: false, message: "Error deleting class group", error: error.message});
    }
};
