// ===================================
// controllers/subject.controller.js
// ===================================
const Subject = require("../models/Subject");
const Teacher = require("../models/Teacher");

exports.getAllSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find();
        if (! subjects) {
            return res.status(404).json({success: false, message: "Subjects not found"});
        }
        res.json({success: true, data: subjects});
    } catch (error) {
        console.error("Error fetching subjects:", error);
        res.status(500).json({success: false, message: "Failed to fetch subjects"});
    }
};

exports.getSubjectById = async (req, res) => {
    try {
        const {id} = req.params;

        const subject = await Subject.findById(id);
        if (! subject) {
            return res.status(404).json({success: false, message: "Subject not found"});
        }

        res.json({success: true, data: subject});
    } catch (error) {
        console.error("Error fetching subject:", error);
        res.status(500).json({success: false, message: "Failed to fetch subject"});
    }
};

exports.createSubject = async (req, res) => {
    try {
        const {
            subjectName,
            teachTime,
            endTime,
            teacherId,
            credit,
            dayOfWeek,
            subjectCode
        } = req.body;

        // Check if teacher exists
        const teacher = await Teacher.find();
        if (! teacher) {
            return res.status(404).json({success: false, message: "Teacher not found"});
        }

        // Validate time range
        if (teachTime && endTime && new Date(teachTime) >= new Date(endTime)) {
            return res.status(400).json({success: false, message: "End time must be after teach time"});
        }

        const subject = new Subject({
            subjectName,
            teachTime,
            endTime,
            teacherId: teacherId,
            credit,
            dayOfWeek,
            subjectCode
        });

        await subject.save();

        // const subjectResponse = await Subject.findById(subject._id).populate(
        // "teacher",
        // "name phone",
        // );

        res.status(201).json({
            success: true, message: "Subject created successfully",
            // data: subjectResponse,
        });
    } catch (error) {
        console.error("Error creating subject:", error);
        res.status(500).json({success: false, message: "Failed to create subject"});
    }
};
exports.updateSubject = async (req, res) => {
    try {
        const {
            teacherId,
            subjectName,
            teachTime,
            endTime,
            credit,
            dayOfWeek,
            subjectCode
        } = req.body;

        // First, find the existing subject
        const subject = await Subject.findById(req.params.id);
        if (! subject) {
            return res.status(404).json({success: false, message: "Subject not found"});
        }

        // Build update data object
        const updateData = {};
        if (subjectName) 
            updateData.subjectName = subjectName;
        
        if (teachTime) 
            updateData.teachTime = teachTime;
        
        if (endTime) 
            updateData.endTime = endTime;
        
        if (credit !== undefined) 
            updateData.credit = credit;
        
        if (dayOfWeek) 
            updateData.dayOfWeek = dayOfWeek;
        
        if (subjectCode) 
            updateData.subjectCode = subjectCode;
        

        // If teacher is being updated, verify teacher exists
        if (teacherId) {
            const teacher = await Teacher.findById(teacherId);
            if (! teacher) {
                return res.status(404).json({success: false, message: "Teacher not found"});
            }
            updateData.teacherId = teacherId; // Fixed: use teacherId instead of teacher
        }

        // Validate time range if either time is being updated
        const newTeachTime = teachTime || subject.teachTime;
        const newEndTime = endTime || subject.endTime;

        if (newTeachTime && newEndTime && new Date(newTeachTime) >= new Date(newEndTime)) {
            return res.status(400).json({success: false, message: "End time must be after teach time"});
        }

        // Update the subject
        const updatedSubject = await Subject.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        } // Added runValidators
        );

        res.json({success: true, message: "Subject updated successfully", data: updatedSubject});
    } catch (error) {
        console.error("Error updating subject:", error);
        res.status(500).json({
            success: false, message: "Failed to update subject", error: error.message, // Added for debugging
        });
    }
};

exports.deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findByIdAndDelete(req.params.id);

        if (! subject) {
            return res.status(404).json({success: false, message: "Subject not found"});
        }

        res.json({success: true, message: "Subject deleted successfully"});
    } catch (error) {
        console.error("Error deleting subject:", error);
        res.status(500).json({success: false, message: "Failed to delete subject"});
    }
};

exports.getSubjectsByTeacher = async (req, res) => {
    try {
        const subjects = await Subject.find({teacherId: req.params.teacherId}).sort({teachTime: 1});

        res.json({success: true, data: subjects, count: subjects.length});
    } catch (error) {
        console.error("Error fetching subjects by teacher:", error);
        res.status(500).json({success: false, message: "Failed to fetch subjects"});
    }
};

exports.getSubjectSchedule = async (req, res) => {
    try {
        const {date} = req.query;

        let query = {};

        // If date is provided, filter subjects for that day
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            query.teachTime = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }

        const subjects = await Subject.find(query).populate("teacherId", "name phone").sort({teachTime: 1});

        res.json({success: true, data: subjects, count: subjects.length});
    } catch (error) {
        console.error("Error fetching subject schedule:", error);
        res.status(500).json({success: false, message: "Failed to fetch schedule"});
    }
};
