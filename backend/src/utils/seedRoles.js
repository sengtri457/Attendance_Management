// ===================================
// utils/seedRoles.js
// ===================================
const Role = require("../models/Role");
const seedRoles = async () => {
  try {
    const count = await Role.countDocuments();

    // If no roles exist, create default ones
    if (count === 0) {
      const defaultRoles = [
        {
          roleName: "Admin",
          roleDescription: "Full system access with all permissions",
        },
        {
          roleName: "Teacher",
          roleDescription: "Can manage students, attendance, and subjects",
        },
        {
          roleName: "Student",
          roleDescription: "Can view own information and submit leave requests",
        },
        {
          roleName: "Parent",
          roleDescription: "Can view children information and attendance",
        },
      ];

      await Role.insertMany(defaultRoles);
      console.log("✅ Default roles created successfully");
    }
  } catch (error) {
    console.error("Error seeding roles:", error);
  }
};

module.exports = { seedRoles };
