const Student = require("../models/Student");
const ParentStudent = require("../models/ParentStudent");
const User = require("../models/User");
const Role = require("../models/Role");
const ClassGroup = require("../models/ClassGroup");
const xlsx = require("xlsx");
const bcrypt = require("bcryptjs");

exports.getAllStudents = async (req, res) => {
    try { // Extract query parameters
        const {
            page = 1,
            limit = 10,
            search = "",
            sortBy = "createdAt",
            sortOrder = "desc",
            classGroupId
        } = req.query;

        // Convert to numbers
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build search query
        const searchQuery = {
            isBlacklisted: false
        };

        if (classGroupId) {
            searchQuery.classGroup = classGroupId;
        }

        // Add search conditions if search term exists
        if (search) {
            searchQuery.$or = [
                {
                    firstName: {
                        $regex: search,
                        $options: "i"
                    }
                }, {
                    studentId: {
                        $regex: search,
                        $options: "i"
                    }
                }, {
                    phone: {
                        $regex: search,
                        $options: "i"
                    }
                }, {
                    email: {
                        $regex: search,
                        $options: "i"
                    }
                },
            ];
        }

        // Build sort object
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

        // Execute query with pagination
        const [students, totalCount] = await Promise.all([
            Student.find(searchQuery).populate("user", "username email").populate("parentStudent", "name phone").populate("classGroup", "name").sort(sortOptions).skip(skip).limit(limitNum).lean(), // Use lean() for better performance
            Student.countDocuments(searchQuery),
        ]);

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        res.json({
            success: true,
            data: students,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                limit: limitNum,
                hasNextPage,
                hasPrevPage
            }
        });
    } catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({success: false, message: "Failed to fetch students"});
    }
};

exports.getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id).populate("user", "username email isActive").populate("parentStudent", "name phone").populate("classGroup", "name academicYear");

        if (! student) {
            return res.status(404).json({success: false, message: "Student not found"});
        }

        res.json({success: true, data: student});
    } catch (error) {
        console.error("Error fetching student:", error);
        res.status(500).json({success: false, message: "Failed to fetch student"});
    }
};

exports.createStudent = async (req, res) => {
    try {
        const {
            userId,
            firstName,
            lastName,
            dob,
            gender,
            phone,
            photo,
            parentId,
            classGroup
        } = req.body;

        const student = new Student({
            user: userId,
            firstName,
            lastName,
            dob,
            gender,
            phone,
            photo,
            classGroup
        });

        await student.save();

        if (parentId) {
            const parentStudent = new ParentStudent({parent: parentId, student: student._id});
            await parentStudent.save();
        }

        res.status(201).json({
            success: true,
            message: "Student created successfully",
            data: {
                studentId: student._id
            }
        });
    } catch (error) {
        console.error("Error creating student:", error);
        res.status(500).json({success: false, message: "Failed to create student"});
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            dob,
            gender,
            phone,
            photo,
            classGroup
        } = req.body;

        const student = await Student.findByIdAndUpdate(req.params.id, {
            firstName,
            lastName,
            dob,
            gender,
            phone,
            photo,
            classGroup
        }, {
            new: true
        },);

        if (! student) {
            return res.status(404).json({success: false, message: "Student not found"});
        }

        res.json({success: true, message: "Student updated successfully", data: student});
    } catch (error) {
        console.error("Error updating student:", error);
        res.status(500).json({success: false, message: "Failed to update student"});
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(req.params.id, {
            isBlacklisted: true
        }, {
            new: true
        },);

        if (! student) {
            return res.status(404).json({success: false, message: "Student not found"});
        }

        res.json({success: true, message: "Student blacklisted successfully"});
    } catch (error) {
        console.error("Error blacklisting student:", error);
        res.status(500).json({success: false, message: "Failed to blacklist student"});
    }
};
exports.getBlacklistedStudents = async (req, res) => {
    try {
        const students = await Student.find({isBlacklisted: true}).populate("user", "username email").populate("parentStudent", "name phone");

        res.json({success: true, data: students});
    } catch (error) {
        console.error("Error fetching blacklisted students:", error);
        res.status(500).json({success: false, message: "Failed to fetch blacklisted students"});
    }
};
exports.restoreStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(req.params.id, {
            isBlacklisted: false
        }, {
            new: true
        },);

        if (! student) {
            return res.status(404).json({success: false, message: "Student not found"});
        }

        res.json({success: true, message: "Student restored successfully", data: student});
    } catch (error) {
        console.error("Error restoring student:", error);
        res.status(500).json({success: false, message: "Failed to restore student"});
    }
};

exports.getStudentParents = async (req, res) => {
    try {
        const relationships = await ParentStudent.find({student: req.params.id}).populate({
            path: "parent",
            populate: {
                path: "user",
                select: "username email"
            }
        });

        const parents = relationships.map((rel) => rel.parent);

        res.json({success: true, data: parents});
    } catch (error) {
        console.error("Error fetching student parents:", error);
        res.status(500).json({success: false, message: "Failed to fetch parents"});
    }
};

exports.importStudents = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({success: false, message: "No file uploaded"});
    }

    const results = {
        total: 0,
        success: 0,
        failed: 0,
        errors: []
    };

    try {
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        results.total = data.length;

        const studentRole = await Role.findOne({roleName: "Student"});
        if (! studentRole) {
            throw new Error("Role 'Student' not found in database.");
        }

        for (const row of data) {
            try { // Validate required fields
                if (! row.email || ! row.username || ! row.firstName || ! row.lastName) {
                    throw new Error(`Missing required fields for ${
                        row.email || "unknown row"
                    }`,);
                }

                // Check duplicate
                const existingUser = await User.findOne({
                    $or: [
                        {
                            email: row.email
                        }, {
                            username: row.username
                        }
                    ]
                });
                if (existingUser) {
                    throw new Error(`User already exists: ${
                        row.email
                    }`);
                }

                // Create User
                const plainPassword = row.password ? String(row.password) : "Student123!";

                const user = new User({
                    username: row.username,
                    email: row.email,
                    password: plainPassword,
                    role: studentRole._id,
                    isActive: true
                });
                await user.save();

                // Create Student
                // If dob is Excel serial date, xlsx usually handles it if configured, or it returns serial number.
                // Assuming string date or JS date for now.
                const dob = row.dob ? new Date(row.dob) : new Date();

                // Find Class Group if provided
                let classGroupId = null;
                const className = row.class || row.className || row.classGroup || row.Class || row["Class Group"];
                if (className) {
                    const classGroupDoc = await ClassGroup.findOne({
                        name: {
                            $regex: new RegExp(`^${className}$`, 'i')
                        }
                    });
                    if (classGroupDoc) {
                        classGroupId = classGroupDoc._id;
                    }
                }

                const student = new Student({
                    user: user._id,
                    studentId: row.studentId || `STU${
                        Date.now()
                    }${
                        Math.floor(Math.random() * 1000)
                    }`,
                    firstName: row.firstName,
                    lastName: row.lastName,
                    dob: dob,
                    gender: row.gender || "Other",
                    phone: row.phone || "",
                    classGroup: classGroupId
                });
                await student.save();

                results.success ++;
            } catch (err) {
                results.failed ++;
                results.errors.push({row: row, error: err.message});
            }
        }

        res.json({success: true, message: "Import completed", results});
    } catch (error) {
        console.error("Import error:", error);
        res.status(500).json({success: false, message: "Failed to process file", error: error.message});
    }
};
