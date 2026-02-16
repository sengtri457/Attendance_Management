// ===================================
// controllers/attendance.controller.js
// ===================================
const Attendance = require("../models/Attendancce");
const LeaveRequest = require("../models/LeaveRequest");
const Subject = require("../models/Subject"); // Import Subject model
const mongoose = require("mongoose");
const moment = require("moment-timezone");
const telegramUtils = require("../utils/telegram");

// Configuration for attendance rules
const ATTENDANCE_CONFIG = {
    OFFICE_START_TIME: "08:00", // Default if no subject
    GRACE_PERIOD_MINUTES: 15,
    HALF_DAY_HOURS: 4,
    FULL_DAY_HOURS: 8,
    TIMEZONE: "Asia/Phnom_Penh"
};

const calculateAttendanceStatus = (checkInTime, checkOutTime, scheduleStartTime = ATTENDANCE_CONFIG.OFFICE_START_TIME) => {
    if (!checkInTime) {
        return {status: "absent", isLate: false, lateBy: 0, workHours: 0};
    }

    const TIMEZONE = "Asia/Phnom_Penh";
    const checkIn = moment.tz(checkInTime, TIMEZONE);

    if (! checkIn.isValid()) {
        return {status: "absent", isLate: false, lateBy: 0, workHours: 0};
    }

    // Use provided schedule start time or default
    const startHour = parseInt(scheduleStartTime.split(":")[0]);
    const startMinute = parseInt(scheduleStartTime.split(":")[1]);

    const classStart = moment.tz(checkInTime, TIMEZONE).set({hour: startHour, minute: startMinute, second: 0});

    const graceTime = moment(classStart).add(ATTENDANCE_CONFIG.GRACE_PERIOD_MINUTES, "minutes");

    let status = "present";
    let isLate = false;
    let lateBy = 0;

    // Late check
    if (checkIn.isAfter(graceTime)) {
        isLate = true;
        lateBy = checkIn.diff(classStart, "minutes");
        status = "late";
    }

    // Work hour calcs
    let workHours = 0;
    if (checkOutTime) {
        const checkOut = moment.tz(checkOutTime, TIMEZONE);
        if (checkOut.isValid()) {
            workHours = checkOut.diff(checkIn, "hours", true);
            workHours = Math.round(workHours * 100) / 100;

            // Only set half-day if not already late
            if (workHours < ATTENDANCE_CONFIG.HALF_DAY_HOURS && ! isLate) {
                status = "half-day";
            }
        }
    }

    return {status, isLate, lateBy, workHours};
};

// Helper to get start time from subject for a specific date
const getSubjectStartTime = async (subjectId, date) => {
    if (!subjectId) 
        return null;
    


    try {
        const subject = await Subject.findById(subjectId);
        if (! subject) 
            return null;
        


        // 1. Check for sessions (Complex Schedule)
        if (subject.sessions && subject.sessions.length > 0) {
            const dayName = moment(date).format('dddd');
            // e.g., "Monday"

            // Fix: Check both 'days' array and legacy 'dayOfWeek'
            const session = subject.sessions.find(s => {
                const hasDayInArray = s.days && s.days.includes(dayName);
                const hasLegacyDay = s.dayOfWeek === dayName;
                return hasDayInArray || hasLegacyDay;
            });

            if (session && session.startTime) {
                return session.startTime; // "14:00"
            }
        }

        // 2. Fallback to teachTime (Simple Schedule)
        if (subject.teachTime) {
            // teachTime can be a Date object or string. Extract HH:mm.
            // If Date stored in DB, usually full date.
            return moment(subject.teachTime).format("HH:mm");
        }

        return null;
    } catch (err) {
        console.error("Error fetching subject time:", err);
        return null;
    }
};
// Helper function to check if student is on approved leave
const checkLeaveStatus = async (studentId, date) => {
    const targetDate = moment(date).startOf("day");

    const approvedLeave = await LeaveRequest.findOne({
        student: studentId,
        status: "approved",
        fromDate: {
            $lte: targetDate.toDate()
        },
        toDate: {
            $gte: targetDate.toDate()
        }
    });

    return approvedLeave;
};

// @desc    Get attendance records with enhanced filtering
// @route   GET /api/attendance
// @access  Private
exports.getAttendance = async (req, res) => {
    try {
        const {
            studentId,
            dateFrom,
            dateTo,
            status,
            isLate,
            page = 1,
            limit = 200
        } = req.query;

        let query = {};

        if (studentId) {
            query.student = studentId;
        }

        if (dateFrom || dateTo) {
            query.date = {};
            // Use moment to handle timezone correctly, consistent with markAttendance
            if (dateFrom) 
                query.date.$gte = moment(dateFrom).startOf('day').toDate();
            


            if (dateTo) 
                query.date.$lte = moment(dateTo).endOf('day').toDate();
            


        }

        if (status) {
            query.status = status;
        }

        if (isLate !== undefined) {
            query.isLate = isLate === "true";
        }

        if (req.query.subjectId) {
            query.subject = req.query.subjectId;
        }

        const skip = (page - 1) * limit;
        const total = await Attendance.countDocuments(query);

        const records = await Attendance.find(query).populate("student", "firstName lastName studentId email").populate("markedByTeacher", "name email").populate("subject", "subjectName _id") // Ensure _id is present for mapping.sort({date: -1, checkInTime: -1}).limit(parseInt(limit)).skip(skip);

        res.json({
            success: true,
            data: records,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching attendance:", error);
        res.status(500).json({success: false, message: "Failed to fetch attendance", error: error.message});
    }
};

// @desc    Mark attendance with automatic status calculation
// @route   POST /api/attendance
// @access  Private (Teacher/Admin)
exports.markAttendance = async (req, res) => {
    try {
        const {
            studentId,
            date,
            checkInTime,
            checkOutTime,
            markedByTeacherId,
            note
        } = req.body;

        // Check if attendance already exists for this date and subject
        const existingQuery = {
            student: studentId,
            date: moment(date).startOf("day").toDate()
        };
        if (req.body.subjectId) {
            existingQuery.subject = req.body.subjectId;
        }

        const existingAttendance = await Attendance.findOne(existingQuery);

        if (existingAttendance) {
            return res.status(400).json({success: false, message: "Attendance already marked for this date/subject"});
        }

        // Check if student is on approved leave
        const onLeave = await checkLeaveStatus(studentId, date);

        let attendanceData = {
            student: studentId,
            date: moment(date).startOf("day").toDate(),
            checkInTime,
            markedByTeacher: markedByTeacherId,
            note,
            subject: req.body.subjectId || null
        };

        if (req.body.status) { // Manual status provided
            attendanceData.status = req.body.status;
            attendanceData.isLate = req.body.status === "late";
            attendanceData.lateBy = 0;
            attendanceData.checkOutTime = null;
            attendanceData.workHours = 0;
            if (req.body.status === "excused") {
                attendanceData.status = "excused";
            }
        } else if (onLeave) { // Student is on approved leave
            attendanceData.status = "on-leave";
            attendanceData.isLate = false;
            attendanceData.lateBy = 0;
            attendanceData.leaveReference = onLeave._id;
        } else {
            // Calculate status based on check-in time
            // Determine schedule start time
            let scheduleStartTime = ATTENDANCE_CONFIG.OFFICE_START_TIME;
            if (req.body.subjectId) {
                const subjectTime = await getSubjectStartTime(req.body.subjectId, date);
                if (subjectTime) 
                    scheduleStartTime = subjectTime;
                


            }

            const {status, isLate, lateBy, workHours} = calculateAttendanceStatus(checkInTime, checkOutTime, scheduleStartTime);

            attendanceData.status = status;
            attendanceData.isLate = isLate;
            attendanceData.lateBy = lateBy;
            attendanceData.checkOutTime = checkOutTime || null;
            attendanceData.workHours = workHours;
        }

        const attendance = new Attendance(attendanceData);
        await attendance.save();

        // Populate before sending response
        await attendance.populate("student", "firstName lastName studentId");
        await attendance.populate("markedByTeacher", "name");

        if (attendance.subject) {
            await attendance.populate("subject", "subjectName");
        }

        // Notify Telegram
        telegramUtils.sendAttendanceNotification(attendance, attendance.student, attendance.subject);

        res.status(201).json({success: true, message: "Attendance marked successfully", data: attendance});
    } catch (error) {
        console.error("Error marking attendance:", error);
        res.status(500).json({success: false, message: "Failed to mark attendance", error: error.message});
    }
};
// Check if student is on leave for a specific date
exports.checkStudentLeaveStatus = async (req, res) => {
    try {
        const {studentId, date} = req.query;

        if (!studentId || !date) {
            return res.status(400).json({success: false, message: "Student ID and date are required"});
        }

        const leaveStatus = await checkLeaveStatus(studentId, date);

        res.json({
            success: true,
            onLeave: !! leaveStatus,
            leaveDetails: leaveStatus || null
        });
    } catch (error) {
        console.error("Error checking leave status:", error);
        res.status(500).json({success: false, message: "Failed to check leave status", error: error.message});
    }
};
// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private (Teacher/Admin)
exports.updateAttendance = async (req, res) => {
    try {
        const {checkInTime, checkOutTime, note, status: manualStatus} = req.body;

        let attendance = await Attendance.findById(req.params.id);

        if (! attendance) {
            return res.status(404).json({success: false, message: "Attendance record not found"});
        }

        // Update times
        if (checkInTime) 
            attendance.checkInTime = checkInTime;
        


        if (checkOutTime) 
            attendance.checkOutTime = checkOutTime;
        


        if (note) 
            attendance.note = note;
        


        // Recalculate status if times changed
        if (checkInTime || checkOutTime) {
            let scheduleStartTime = ATTENDANCE_CONFIG.OFFICE_START_TIME;
            if (attendance.subject) {
                const subjectTime = await getSubjectStartTime(attendance.subject, attendance.date);
                if (subjectTime) 
                    scheduleStartTime = subjectTime;
                


            }

            // Use existing times if not provided in update
            const newCheckIn = checkInTime || attendance.checkInTime;
            const newCheckOut = checkOutTime || attendance.checkOutTime;

            const {status, isLate, lateBy, workHours} = calculateAttendanceStatus(newCheckIn, newCheckOut, scheduleStartTime);

            attendance.status = manualStatus || status; // Allow manual override
            attendance.isLate = isLate;
            attendance.lateBy = lateBy;
            attendance.workHours = workHours;
        } else if (manualStatus) { // Manual status update without time change
            attendance.status = manualStatus;
        }

        await attendance.save();

        await attendance.populate("student", "firstName lastName studentId");
        await attendance.populate("markedByTeacher", "name");

        res.json({success: true, message: "Attendance updated successfully", data: attendance});
    } catch (error) {
        console.error("Error updating attendance:", error);
        res.status(500).json({success: false, message: "Failed to update attendance", error: error.message});
    }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private (Admin only)
exports.deleteAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.findByIdAndDelete(req.params.id);

        if (! attendance) {
            return res.status(404).json({success: false, message: "Attendance record not found"});
        }

        res.json({success: true, message: "Attendance deleted successfully"});
    } catch (error) {
        console.error("Error deleting attendance:", error);
        res.status(500).json({success: false, message: "Failed to delete attendance", error: error.message});
    }
};

// @desc    Get attendance statistics for a student
// @route   GET /api/attendance/stats/:studentId
// @access  Private

exports.getStudentStats = async (req, res) => {
    try {
        const {studentId} = req.params;
        const {dateFrom, dateTo} = req.query;

        let dateQuery = {};
        if (dateFrom || dateTo) {
            dateQuery = {};
            if (dateFrom) 
                dateQuery.$gte = new Date(dateFrom);
            


            if (dateTo) 
                dateQuery.$lte = new Date(dateTo);
            


        }

        const stats = await Attendance.aggregate([
            {
                $match: {
                    student: new mongoose.Types.ObjectId(studentId),
                    ...(Object.keys(dateQuery).length > 0 && {
                        date: dateQuery
                    })
                }
            },
            // Group by date to unify daily records
            {
                $group: {
                    _id: "$date",
                    statuses: {
                        $push: "$status"
                    },
                    totalLateBy: {
                        $sum: "$lateBy"
                    },
                    totalWorkHours: {
                        $sum: "$workHours"
                    },
                    isLateAny: {
                        $max: "$isLate"
                    }
                }
            },
            // Determine daily status based on priority: Absent > On-Leave > Late > Half-Day > Present
            {
                $addFields: {
                    dailyStatus: {
                        $cond: [
                            {
                                $in: ["absent", "$statuses"]
                            },
                            "absent", {
                                $cond: [
                                    {
                                        $in: ["on-leave", "$statuses"]
                                    },
                                    "on-leave", {
                                        $cond: [
                                            {
                                                $in: ["late", "$statuses"]
                                            },
                                            "late", {
                                                $cond: [
                                                    {
                                                        $in: ["half-day", "$statuses"]
                                                    },
                                                    "half-day",
                                                    "present"
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                }
            },
            // Sum up daily stats
            {
                $group: {
                    _id: null,
                    totalDays: {
                        $sum: 1
                    },
                    presentDays: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: ["$dailyStatus", "present"]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    lateDays: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: ["$dailyStatus", "late"]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    absentDays: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: ["$dailyStatus", "absent"]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    halfDays: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: ["$dailyStatus", "half-day"]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    onLeaveDays: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: ["$dailyStatus", "on-leave"]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    totalLateMinutes: {
                        $sum: "$totalLateBy"
                    },
                    totalWorkHours: {
                        $sum: "$totalWorkHours"
                    },
                    avgWorkHours: {
                        $avg: "$totalWorkHours"
                    }
                }
            }, {
                $project: {
                    _id: 0,
                    totalDays: 1,
                    presentDays: 1,
                    lateDays: 1,
                    absentDays: 1,
                    halfDays: 1,
                    onLeaveDays: 1,
                    totalLateMinutes: 1,
                    avgLateMinutes: {
                        $cond: [
                            {
                                $gt: ["$lateDays", 0]
                            }, {
                                $divide: ["$totalLateMinutes", "$lateDays"]
                            },
                            0
                        ]
                    },
                    totalWorkHours: {
                        $round: ["$totalWorkHours", 2]
                    },
                    avgWorkHours: {
                        $round: ["$avgWorkHours", 2]
                    },
                    attendanceRate: {
                        $cond: [
                            {
                                $gt: ["$totalDays", 0]
                            }, {
                                $round: [
                                    {
                                        $multiply: [
                                            {
                                                $divide: [
                                                    {
                                                        $add: ["$presentDays", "$onLeaveDays"]
                                                    },
                                                    "$totalDays"
                                                ]
                                            },
                                            100
                                        ]
                                    },
                                    2
                                ]
                            },
                            0
                        ]
                    },
                    punctualityRate: {
                        $cond: [
                            {
                                $gt: ["$presentDays", 0]
                            }, {
                                $round: [
                                    {
                                        $multiply: [
                                            {
                                                $divide: [
                                                    {
                                                        $subtract: ["$presentDays", "$lateDays"]
                                                    },
                                                    "$presentDays"
                                                ]
                                            },
                                            100
                                        ]
                                    },
                                    2
                                ]
                            },
                            0
                        ]
                    }
                }
            }
        ]);

        res.json({
            success: true,
            data: stats[0] || {
                totalDays: 0,
                presentDays: 0,
                lateDays: 0,
                absentDays: 0,
                halfDays: 0,
                onLeaveDays: 0,
                totalLateMinutes: 0,
                avgLateMinutes: 0,
                totalWorkHours: 0,
                avgWorkHours: 0,
                attendanceRate: 0,
                punctualityRate: 0
            }
        });
    } catch (error) {
        console.error("Error fetching student stats:", error);
        res.status(500).json({success: false, message: "Failed to fetch attendance statistics", error: error.message});
    }
};

// @desc    Get late arrivals report
// @route   GET /api/attendance/late-report
// @access  Private (Teacher/Admin)
exports.getLateReport = async (req, res) => {
    try {
        const {
            dateFrom,
            dateTo,
            minLateCount = 1
        } = req.query;

        let dateQuery = {};
        if (dateFrom || dateTo) {
            if (dateFrom) 
                dateQuery.$gte = new Date(dateFrom);
            


            if (dateTo) 
                dateQuery.$lte = new Date(dateTo);
            


        }

        const lateReport = await Attendance.aggregate([
            {
                $match: {
                    isLate: true,
                    ...(Object.keys(dateQuery).length > 0 && {
                        date: dateQuery
                    })
                }
            },
            {
                $group: {
                    _id: "$student",
                    lateCount: {
                        $sum: 1
                    },
                    totalLateMinutes: {
                        $sum: "$lateBy"
                    },
                    avgLateMinutes: {
                        $avg: "$lateBy"
                    },
                    latestLateDate: {
                        $max: "$date"
                    }
                }
            },
            {
                $match: {
                    lateCount: {
                        $gte: parseInt(minLateCount)
                    }
                }
            },
            {
                $lookup: {
                    from: "students",
                    localField: "_id",
                    foreignField: "_id",
                    as: "student"
                }
            }, {
                $unwind: "$student"
            }, {
                $project: {
                    _id: 0,
                    studentId: "$_id",
                    student: {
                        firstName: 1,
                        lastName: 1,
                        studentId: 1,
                        email: 1
                    },
                    lateCount: 1,
                    totalLateMinutes: 1,
                    avgLateMinutes: {
                        $round: ["$avgLateMinutes", 0]
                    },
                    latestLateDate: 1
                }
            }, {
                $sort: {
                    lateCount: -1
                }
            },
        ]);

        res.json({success: true, count: lateReport.length, data: lateReport});
    } catch (error) {
        console.error("Error fetching late report:", error);
        res.status(500).json({success: false, message: "Failed to fetch late report", error: error.message});
    }
};

// @desc    Get absentee report
// @route   GET /api/attendance/absent-report
// @access  Private (Teacher/Admin)
exports.getAbsentReport = async (req, res) => {
    try {
        const {dateFrom, dateTo} = req.query;

        let dateQuery = {};
        if (dateFrom || dateTo) {
            if (dateFrom) 
                dateQuery.$gte = new Date(dateFrom);
            


            if (dateTo) 
                dateQuery.$lte = new Date(dateTo);
            


        }

        const absentReport = await Attendance.aggregate([
            {
                $match: {
                    status: "absent",
                    ...(Object.keys(dateQuery).length > 0 && {
                        date: dateQuery
                    })
                }
            },
            {
                $group: {
                    _id: "$student",
                    absentCount: {
                        $sum: 1
                    },
                    absentDates: {
                        $push: "$date"
                    },
                    lastAbsentDate: {
                        $max: "$date"
                    }
                }
            },
            {
                $lookup: {
                    from: "students",
                    localField: "_id",
                    foreignField: "_id",
                    as: "student"
                }
            },
            {
                $unwind: "$student"
            }, {
                $project: {
                    _id: 0,
                    studentId: "$_id",
                    student: {
                        firstName: 1,
                        lastName: 1,
                        studentId: 1,
                        email: 1
                    },
                    absentCount: 1,
                    lastAbsentDate: 1,
                    absentDates: 1
                }
            }, {
                $sort: {
                    absentCount: -1
                }
            },
        ]);

        res.json({success: true, count: absentReport.length, data: absentReport});
    } catch (error) {
        console.error("Error fetching absent report:", error);
        res.status(500).json({success: false, message: "Failed to fetch absentee report", error: error.message});
    }
};
// @desc    Get today's attendance overview
// @route   GET /api/attendance/today
// @access  Private
exports.getTodayAttendance = async (req, res) => {
    try {
        const today = moment().startOf("day");
        const endOfDay = moment(today).endOf("day");

        const attendance = await Attendance.find({
            date: {
                $gte: today.toDate(),
                $lte: endOfDay.toDate()
            }
        }).populate("student", "firstName lastName studentId").populate("markedByTeacher", "name").populate("subject", "subjectName").sort({checkInTime: 1});

        // Group attendance by student
        const studentAttendance = {};
        attendance.forEach(record => {
            const studentId = record.student ? record.student._id.toString() : 'unknown';
            if (! studentAttendance[studentId]) {
                studentAttendance[studentId] = [];
            }
            studentAttendance[studentId].push(record);
        });

        const summary = {
            total: Object.keys(studentAttendance).length,
            present: 0,
            late: 0,
            absent: 0,
            halfDay: 0,
            onLeave: 0
        };

        // Calculate daily status for each student
        Object.values(studentAttendance).forEach(records => {
            const statuses = records.map(r => r.status);

            if (statuses.includes("absent")) {
                summary.absent ++;
            } else if (statuses.includes("on-leave")) {
                summary.onLeave ++;
            } else if (statuses.includes("late")) {
                summary.late ++;
            } else if (statuses.includes("half-day")) {
                summary.halfDay ++;
            } else {
                summary.present ++;
            }
        });

        return res.json({success: true, date: today.format("YYYY-MM-DD"), summary, data: attendance});
    } catch (error) {
        console.error("Error fetching today's attendance:", error);
        return res.status(500).json({success: false, message: "Failed to fetch today's attendance", error: error.message});
    }
};

// @desc    Mark student as absent (automated or manual)
// @route   POST /api/attendance/mark-absent
// @access  Private (Admin/System)
exports.markAbsent = async (req, res) => {
    try {
        const {studentIds, date, markedByTeacherId, note} = req.body;

        const targetDate = moment(date).startOf("day").toDate();
        const results = [];

        for (const studentId of studentIds) { // Check if attendance already exists
            const existing = await Attendance.findOne({student: studentId, date: targetDate});

            if (existing) {
                results.push({studentId, success: false, message: "Attendance already exists"});
                continue;
            }

            // Check if on approved leave
            const onLeave = await checkLeaveStatus(studentId, date);

            const attendance = new Attendance({
                student: studentId,
                date: targetDate,
                status: onLeave ? "on-leave" : "absent",
                markedByTeacher: markedByTeacherId,
                note: onLeave ? "On approved leave" : note || "Marked absent",
                leaveReference: onLeave ? onLeave._id : null
            });

            await attendance.save();

            results.push({studentId, success: true, message: "Marked absent successfully", attendanceId: attendance._id});
        }

        res.json({success: true, message: "Absence marking completed", results});
    } catch (error) {
        console.error("Error marking absent:", error);
        res.status(500).json({success: false, message: "Failed to mark absent", error: error.message});
    }
};

// get LeaveRequest findByIdAndDelete
//
exports.getLeaveRequest = async (req, res) => {
    try {
        const {id} = req.params;

        const leaveRequest = await LeaveRequest.findById(id);

        if (! leaveRequest) {
            return res.status(404).json({success: false, message: "Leave request not found"});
        }

        res.json({success: true, leaveRequest});
    } catch (error) {
        console.error("Error getting leave request:", error);
        res.status(500).json({success: false, message: "Failed to get leave request", error: error.message});
    }
};
