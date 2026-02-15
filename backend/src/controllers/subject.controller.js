// ===================================
// controllers/subject.controller.js
// ===================================
const Subject = require("../models/Subject");
const Teacher = require("../models/Teacher");

exports.getAllSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find().populate("teacherId", "name phone") // Populate teacher info.populate("classGroup", "name") // Populate legacy class group.populate("classGroups", "name"); // Populate new class groups array

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
            subjectCode,
            classGroup,
            classGroups,
            sessions
        } = req.body;

        // Check if teacher exists if provided
        if (teacherId) {
            const teacher = await Teacher.findById(teacherId);
            if (! teacher) {
                return res.status(404).json({success: false, message: "Teacher not found"});
            }
        }

        const subjectData = {
            subjectName,
            credit,
            subjectCode,
            classGroups: classGroups ? [...new Set(classGroups)] : [],
            sessions
        };

        // Handle legacy fields - only add if they have values
        if (teachTime) 
            subjectData.teachTime = teachTime;
        


        if (endTime) 
            subjectData.endTime = endTime;
        


        if (dayOfWeek) 
            subjectData.dayOfWeek = dayOfWeek;
        


        if (teacherId) 
            subjectData.teacherId = teacherId;
        


        if (classGroup) 
            subjectData.classGroup = classGroup;
        


        const subject = new Subject(subjectData);

        await subject.save();

        res.status(201).json({success: true, message: "Subject created successfully", data: subject});
    } catch (error) {
        console.error("Error creating subject:", error);
        res.status(500).json({success: false, message: "Failed to create subject", error: error.message});
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
            subjectCode,
            classGroup,
            classGroups,
            sessions
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
        


        if (classGroup) 
            updateData.classGroup = classGroup;
        


        if (classGroups) { // Deduplicate class groups to avoid storing same group multiple times
            updateData.classGroups = [...new Set(classGroups)];
        }


        if (sessions) 
            updateData.sessions = sessions;
        


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
            const queryDate = new Date(date);
            const days = [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday"
            ];
            const dayName = days[queryDate.getDay()];
            // e.g. "Monday"

            // Filter for subjects that meet on this day
            // EITHER legacy way: dayOfWeek == dayName
            // OR new way: sessions array contains an entry with day == dayName
            query.$or = [
                {
                    dayOfWeek: dayName
                }, {
                    "sessions.days": dayName
                }, {
                    "sessions.dayOfWeek": dayName
                }
            ];
        }

        const subjects = await Subject.find(query).populate("teacherId", "name phone").populate("classGroup", "name").populate("classGroups", "name").lean();
        // Use lean() to allow modification

        // If filtering by date, we need to transform the data to show the correct time for that day
        // because "teachTime" might be legacy or null for multi-session subjects
        if (date) {
            const queryDate = new Date(date);
            const days = [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday"
            ];
            const dayName = days[queryDate.getDay()];

            subjects.forEach(sub => { // Check if it's a multi-session subject
                if (sub.sessions && sub.sessions.length > 0) {
                    const session = sub.sessions.find(s => (s.days && s.days.includes(dayName)) || s.dayOfWeek === dayName);
                    if (session) {
                        // Construct a date object for the session time
                        // session.startTime is "HH:mm"
                        const [startHour, startMin] = session.startTime.split(':');
                        const [endHour, endMin] = session.endTime.split(':');

                        // Create Date objects for this specific day
                        const sTime = new Date(queryDate);
                        sTime.setHours(parseInt(startHour), parseInt(startMin), 0);

                        const eTime = new Date(queryDate);
                        eTime.setHours(parseInt(endHour), parseInt(endMin), 0);

                        // Override the display properties
                        sub.teachTime = sTime;
                        sub.endTime = eTime;
                        sub.room = session.room; // Add room if available
                    }
                }
            });

            // Re-sort based on the potentially updated teachTime
            subjects.sort((a, b) => new Date(a.teachTime) - new Date(b.teachTime));
        } else { // Fallback sort if no date provided
            subjects.sort((a, b) => {
                const getTime = (subj) => {
                    if (subj.teachTime) 
                        return new Date(subj.teachTime).getTime();
                    
                    if (subj.sessions && subj.sessions.length > 0) { // Parse "HH:mm" from the first session as a fallback comparison
                        const [hours, minutes] = subj.sessions[0].startTime.split(':');
                        const d = new Date();
                        d.setHours(hours, minutes, 0, 0);
                        return d.getTime();
                    }
                    return 8640000000000; // Far future for subjects with no time
                };
                return getTime(a) - getTime(b);
            });
        }

        res.json({success: true, data: subjects, count: subjects.length});
    } catch (error) {
        console.error("Error fetching subject schedule:", error);
        res.status(500).json({success: false, message: "Failed to fetch schedule"});
    }
};
