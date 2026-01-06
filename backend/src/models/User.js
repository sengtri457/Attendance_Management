const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true,
  },
  studentPopulate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
userSchema.virtual("studentInfo", {
  ref: "Student",
  localField: "_id",
  foreignField: "user",
  justOne: true,
});
userSchema.virtual("parentInfo", {
  ref: "ParentStudent",
  localField: "_id",
  foreignField: "user",
  justOne: true,
});

userSchema.virtual("teacherInfo", {
  ref: "Teacher",
  localField: "_id",
  foreignField: "user",
  justOne: true,
});
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
  // ✅ No next() needed with async/await
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
