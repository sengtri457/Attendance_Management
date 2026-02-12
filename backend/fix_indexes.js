const mongoose = require("mongoose");
require("dotenv").config();

// Use the URI from .env or hardcoded if necessary
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://sengtri457_db_user:mbUGc9zB6kb5wr1q@attendancestudent.olfaukl.mongodb.net/Attendance";

const fixIndexes = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB...");

        const db = mongoose.connection.db;
        const collection = db.collection("attendances");

        // List current indexes
        const indexes = await collection.indexes();
        console.log("Current indexes:", indexes);

        // Drop all indexes except _id
        // This forces Mongoose to recreate them correctly according to the schema on next app start
        console.log("Dropping all indexes on 'attendances' collection...");
        await collection.dropIndexes();
        console.log("All indexes dropped successfully.");

        // Note: Mongoose will recreate them when the app restarts
        console.log("Please restart your backend application to recreate the indexes correctly.");

        process.exit(0);
    } catch (error) {
        console.error("Error fixing indexes:", error);
        process.exit(1);
    }
};

fixIndexes();
