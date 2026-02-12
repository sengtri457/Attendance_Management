const mongoose = require("mongoose");
const moment = require("moment-timezone");
const Subject = require("./src/models/Subject");
const Teacher = require("./src/models/Teacher");

// Hardcoded URI for convenience since we know it
const MONGODB_URI = "mongodb+srv://sengtri457_db_user:mbUGc9zB6kb5wr1q@attendancestudent.olfaukl.mongodb.net/Attendance";

const seedData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB for seeding...");

        // Get any teacher to assign (optional)
        const teacher = await Teacher.findOne();
        const teacherId = teacher ? teacher._id : null;

        if (! teacherId) {
            console.log("Warning: No teacher found in database. Subjects will be created without a teacher.");
        }

        // Define subjects for TODAY
        const today = moment().startOf('day'); // 00:00 today
        const baseDate = today.format('YYYY-MM-DD');

        const subjects = [
            {
                subjectName: "Web Development",
                teachTime: moment(`${baseDate}T08:00:00`).toDate(),
                endTime: moment(`${baseDate}T10:00:00`).toDate(),
                dayOfWeek: "Thursday", // Feb 12 2026 is a Thursday
                credit: 3,
                subjectCode: "WEB101",
                description: "Introduction to Web Technologies"
            }, {
                subjectName: "Database Systems",
                teachTime: moment(`${baseDate}T10:30:00`).toDate(),
                endTime: moment(`${baseDate}T12:30:00`).toDate(),
                dayOfWeek: "Thursday",
                credit: 3,
                subjectCode: "DB101",
                description: "SQL and NoSQL Databases"
            }, {
                subjectName: "Information Systems",
                teachTime: moment(`${baseDate}T14:00:00`).toDate(),
                endTime: moment(`${baseDate}T16:00:00`).toDate(),
                dayOfWeek: "Thursday",
                credit: 3,
                subjectCode: "IS101",
                description: "MIS Fundamentals"
            }, {
                subjectName: "Java Programming",
                teachTime: moment(`${baseDate}T16:00:00`).toDate(),
                endTime: moment(`${baseDate}T18:00:00`).toDate(),
                dayOfWeek: "Thursday",
                credit: 4,
                subjectCode: "JAVA101",
                description: "Advanced Java Concepts"
            }
        ];

        // Add teacherId if available
        const subjectsWithTeacher = subjects.map(s => ({
            ...s,
            teacherId: teacherId
        }));

        // Start creation
        console.log(`Creating ${
            subjects.length
        } subjects for date: ${baseDate}...`);

        // Optional: clear existing subjects for today to avoid duplicates if re-run
        // const start = today.toDate();
        // const end = moment(today).endOf('day').toDate();
        // await Subject.deleteMany({ teachTime: { $gte: start, $lte: end } });

        const created = await Subject.insertMany(subjectsWithTeacher);
        console.log("Successfully created subjects:", created.map(s => s.subjectName));

        console.log("Seeding complete!");
        process.exit(0);

    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedData();
