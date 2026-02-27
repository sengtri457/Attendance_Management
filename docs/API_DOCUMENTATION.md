# 📚 Attendance Student Management System — API Documentation

> **Version:** 1.0.0  
> **Base URL:** `http://localhost:4000/api`  
> **Database:** MongoDB (Mongoose)  
> **Auth:** JSON Web Token (JWT Bearer Token)  
> **Last Updated:** February 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Roles & Permissions](#roles--permissions)
5. [API Endpoints](#api-endpoints)
   - [Auth](#1-auth)
   - [Users](#2-users)
   - [Students](#3-students)
   - [Teachers](#4-teachers)
   - [Parents](#5-parents)
   - [Parent-Student Relations](#6-parent-student-relations)
   - [Subjects](#7-subjects)
   - [Class Groups](#8-class-groups)
   - [Attendance](#9-attendance)
   - [Leave Requests](#10-leave-requests)
   - [Roles](#11-roles)
6. [Data Models](#data-models)
7. [Developer Guidelines](#developer-guidelines)

---

## Overview

The **Attendance Student Management System API** is a RESTful API built with **Node.js + Express** and **MongoDB**. It manages school attendance records, student/teacher/parent profiles, leave requests, class groups, and subjects.

### Technology Stack

| Layer      | Technology                    |
|------------|-------------------------------|
| Runtime    | Node.js                       |
| Framework  | Express.js v5                 |
| Database   | MongoDB via Mongoose v9       |
| Auth       | JWT (`jsonwebtoken`)          |
| File Upload| Multer                        |
| Password   | bcryptjs                      |
| Port       | `4000` (default)              |

---

## Authentication

Most API routes are **protected** and require a valid JWT token in the `Authorization` header.

### How to Authenticate

1. Call `POST /api/auth/login` with valid credentials.
2. Get the `tokens` value from the response.
3. Include it in every subsequent request:

```http
Authorization: Bearer <your_jwt_token>
```

### Token Payload

```json
{
  "userId": "64abc...",
  "username": "john_doe",
  "role": "Teacher"
}
```

- Token expires in **30 days**.
- Tokens use `JWT_SECRET` from `.env` file.

---

## Error Handling

All API responses follow a consistent structure:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

### HTTP Status Codes

| Code | Meaning                          |
|------|----------------------------------|
| 200  | OK – Request succeeded           |
| 201  | Created – Resource created       |
| 400  | Bad Request – Invalid input      |
| 401  | Unauthorized – Token missing/invalid |
| 403  | Forbidden – Insufficient role    |
| 404  | Not Found – Resource not found   |
| 500  | Internal Server Error            |

---

## Roles & Permissions

The system supports 4 roles:

| Role      | Description                                      |
|-----------|--------------------------------------------------|
| `Admin`   | Full access to all resources                     |
| `Teacher` | Can mark/manage attendance & review leave        |
| `Student` | Can view own attendance & submit leave requests  |
| `Parent`  | Can view child's attendance                      |

> **Note:** Routes marked with 🔒 require authentication. Routes marked with 👑 require specific roles.

---

## API Endpoints

---

### 1. Auth

**Base path:** `/api/auth`

#### POST /api/auth/login
Login and receive a JWT token.

- **Auth required:** ❌ No
- **Body:**
```json
{
  "username": "john_doe",
  "password": "yourpassword"
}
```
- **Response:**
```json
{
  "success": true,
  "data": {
    "tokens": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "64abc123...",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "Teacher",
      "studentId": null,
      "teacherId": "64xyz...",
      "parentId": null
    }
  }
}
```

---

#### POST /api/auth/register
Register a new user account.

- **Auth required:** ❌ No
- **Body:**
```json
{
  "username": "new_user",
  "password": "securepassword",
  "email": "user@email.com",
  "roleId": "64roleObjectId..."
}
```
- **Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": { "userId": "64abc..." }
}
```

---

### 2. Users

**Base path:** `/api/users`

| Method | Endpoint                        | Role Required | Description                  |
|--------|---------------------------------|---------------|------------------------------|
| GET    | `/api/users`                    | 🔒👑 Admin    | Get all users                |
| GET    | `/api/users/:id`                | 🔒 Any        | Get user by ID               |
| POST   | `/api/users`                    | ❌ Public      | Create new user              |
| PUT    | `/api/users/:id`                | 🔒👑 Admin    | Update user                  |
| DELETE | `/api/users/:id`                | 🔒👑 Admin    | Delete user                  |
| PATCH  | `/api/users/:id/toggle-status`  | 🔒👑 Admin    | Activate/deactivate account  |
| PATCH  | `/api/users/:id/change-password`| 🔒 Any        | Change own password          |
| PATCH  | `/api/users/:id/profile`        | 🔒 Any        | Update own profile           |

#### Example: POST /api/users
```json
{
  "username": "student_001",
  "password": "pass123",
  "email": "student@school.com",
  "role": "64roleId..."
}
```

#### Example: PATCH /api/users/:id/change-password
```json
{
  "currentPassword": "oldpass",
  "newPassword": "newpass123"
}
```

---

### 3. Students

**Base path:** `/api/students`

| Method | Endpoint                   | Role Required        | Description                |
|--------|----------------------------|----------------------|----------------------------|
| GET    | `/api/students`            | 🔒 Any               | Get all students           |
| GET    | `/api/students/blacklisted`| 🔒 Any               | Get blacklisted students   |
| GET    | `/api/students/:id`        | 🔒 Any               | Get student by ID          |
| GET    | `/api/students/:id/parents`| 🔒 Any               | Get student's parents      |
| POST   | `/api/students`            | ❌ Public             | Create new student         |
| POST   | `/api/students/import`     | ❌ Public (multipart) | Import students from file  |
| PUT    | `/api/students/:id`        | 🔒 Any               | Update student             |
| PUT    | `/api/students/restore/:id`| ❌ Public             | Restore deleted student    |
| DELETE | `/api/students/:id`        | 🔒👑 Admin            | Delete student             |

#### Example: POST /api/students
```json
{
  "user": "64userId...",
  "firstName": "Sophea",
  "lastName": "Chan",
  "dob": "2005-03-15",
  "gender": "female",
  "phone": "+85512345678",
  "classGroup": "64classGroupId..."
}
```

#### Example: POST /api/students/import
- **Content-Type:** `multipart/form-data`
- **Form field:** `file` (Excel/CSV file)

---

### 4. Teachers

**Base path:** `/api/teachers`

| Method | Endpoint                   | Role Required   | Description             |
|--------|----------------------------|-----------------|-------------------------|
| GET    | `/api/teachers`            | 🔒 Any          | Get all teachers        |
| GET    | `/api/teachers/:id`        | 🔒 Any          | Get teacher by ID       |
| GET    | `/api/teachers/:id/subjects`| 🔒 Any         | Get teacher's subjects  |
| POST   | `/api/teachers`            | 🔒👑 Admin      | Create new teacher      |
| PUT    | `/api/teachers/:id`        | 🔒 Any          | Update teacher          |
| DELETE | `/api/teachers/:id`        | 🔒👑 Admin      | Delete teacher          |

#### Example: POST /api/teachers
```json
{
  "user": "64userId...",
  "subject": "64subjectId...",
  "name": "Mr. Dara",
  "phone": "+85598765432"
}
```

---

### 5. Parents

**Base path:** `/api/parents`

| Method | Endpoint                         | Role Required | Description             |
|--------|----------------------------------|---------------|-------------------------|
| GET    | `/api/parents`                   | 🔒 Any        | Get all parents         |
| GET    | `/api/parents/:id`               | 🔒 Any        | Get parent by ID        |
| GET    | `/api/parents/:id/children`      | 🔒 Any        | Get parent's children   |
| POST   | `/api/parents`                   | 🔒👑 Admin    | Create new parent       |
| POST   | `/api/parents/:id/children`      | 🔒👑 Admin    | Add child to parent     |
| PUT    | `/api/parents/:id`               | 🔒 Any        | Update parent           |
| DELETE | `/api/parents/:id`               | 🔒👑 Admin    | Delete parent           |
| DELETE | `/api/parents/:id/children/:studentId` | 🔒👑 Admin | Remove child from parent|

#### Example: POST /api/parents
```json
{
  "user": "64userId...",
  "parentName": "Mrs. Bopha",
  "phone": "+85512000000"
}
```

---

### 6. Parent-Student Relations

**Base path:** `/api/parent-students`

| Method | Endpoint                    | Role Required | Description                       |
|--------|-----------------------------|---------------|-----------------------------------|
| GET    | `/api/parent-students`      | 🔒 Any        | Get all parent-student relations  |
| GET    | `/api/parent-students/:id`  | 🔒 Any        | Get relation by ID                |
| POST   | `/api/parent-students`      | 🔒 Any        | Create parent-student relation    |
| DELETE | `/api/parent-students/:id`  | 🔒 Any        | Delete relation                   |

#### Example: POST /api/parent-students
```json
{
  "parentId": "64parentId...",
  "studentId": "64studentId..."
}
```

---

### 7. Subjects

**Base path:** `/api/subjects`

| Method | Endpoint                            | Role Required     | Description                |
|--------|-------------------------------------|-------------------|----------------------------|
| GET    | `/api/subjects`                     | 🔒 Any            | Get all subjects           |
| GET    | `/api/subjects/schedule`            | 🔒 Any            | Get subject schedule       |
| GET    | `/api/subjects/:id`                 | 🔒 Any            | Get subject by ID          |
| GET    | `/api/subjects/teacher/:teacherId`  | 🔒 Any            | Get subjects by teacher    |
| POST   | `/api/subjects`                     | 🔒👑 Admin/Teacher| Create subject             |
| PUT    | `/api/subjects/:id`                 | 🔒👑 Admin/Teacher| Update subject             |
| DELETE | `/api/subjects/:id`                 | 🔒👑 Admin        | Delete subject             |

#### Example: POST /api/subjects
```json
{
  "subjectName": "Mathematics",
  "subjectCode": "MATH101",
  "description": "Basic algebra and calculus",
  "teacherId": "64teacherId...",
  "credit": 3,
  "classGroups": ["64classGroupId..."],
  "sessions": [
    {
      "days": ["Monday", "Wednesday"],
      "startTime": "08:00",
      "endTime": "09:30",
      "room": "Room A1"
    }
  ]
}
```

---

### 8. Class Groups

**Base path:** `/api/class-groups`

| Method | Endpoint                  | Auth Required | Description            |
|--------|---------------------------|---------------|------------------------|
| GET    | `/api/class-groups`       | ❌ Public      | Get all class groups   |
| GET    | `/api/class-groups/:id`   | ❌ Public      | Get class group by ID  |
| POST   | `/api/class-groups`       | ❌ Public      | Create class group     |
| PUT    | `/api/class-groups/:id`   | ❌ Public      | Update class group     |
| DELETE | `/api/class-groups/:id`   | ❌ Public      | Delete class group     |

#### Example: POST /api/class-groups
```json
{
  "groupName": "Class 12A",
  "description": "Science stream grade 12"
}
```

---

### 9. Attendance

**Base path:** `/api/attendance`

| Method | Endpoint                              | Role Required       | Description                        |
|--------|---------------------------------------|---------------------|------------------------------------|
| GET    | `/api/attendance`                     | 🔒 Any              | Get attendance records (filterable)|
| GET    | `/api/attendance/today`               | 🔒 Any              | Get today's attendance             |
| GET    | `/api/attendance/stats/:studentId`    | 🔒 Any              | Get student attendance stats       |
| GET    | `/api/attendance/late-report`         | 🔒👑 Teacher/Admin  | Get late arrival report            |
| GET    | `/api/attendance/absent-report`       | 🔒👑 Teacher/Admin  | Get absent student report          |
| GET    | `/api/attendance/check-leave-status`  | 🔒 Any              | Check student leave status         |
| GET    | `/api/attendance/leave-request/:id`   | 🔒 Any              | Get leave request by ID            |
| POST   | `/api/attendance`                     | 🔒👑 Teacher/Admin  | Mark single attendance             |
| POST   | `/api/attendance/bulk`                | 🔒👑 Teacher/Admin  | Mark bulk attendance               |
| POST   | `/api/attendance/mark-absent`         | 🔒👑 Teacher/Admin  | Mark student absent                |
| PUT    | `/api/attendance/:id`                 | 🔒👑 Teacher/Admin  | Update attendance record           |
| DELETE | `/api/attendance/:id`                 | 🔒👑 Admin          | Delete attendance record           |

#### Example: POST /api/attendance (mark single)
```json
{
  "student": "64studentId...",
  "subject": "64subjectId...",
  "date": "2026-02-25",
  "checkInTime": "2026-02-25T08:05:00.000Z",
  "status": "present",
  "note": "On time"
}
```

#### Example: POST /api/attendance/bulk (mark all at once)
```json
{
  "subjectId": "64subjectId...",
  "date": "2026-02-25",
  "records": [
    { "student": "64studentId1...", "status": "present" },
    { "student": "64studentId2...", "status": "late", "lateBy": 10 },
    { "student": "64studentId3...", "status": "absent" }
  ]
}
```

#### Attendance Status Values

| Status      | Description                   |
|-------------|-------------------------------|
| `present`   | Student was present           |
| `absent`    | Student was absent            |
| `late`      | Student arrived late          |
| `half-day`  | Student attended half the day |
| `on-leave`  | Student is on approved leave  |
| `excused`   | Excused absence               |

#### Query Parameters for GET /api/attendance

| Parameter    | Type   | Description                    |
|-------------|--------|--------------------------------|
| `studentId` | string | Filter by student ID           |
| `subjectId` | string | Filter by subject ID           |
| `date`      | string | Filter by specific date        |
| `startDate` | string | Start of date range            |
| `endDate`   | string | End of date range              |
| `status`    | string | Filter by status               |
| `classGroup`| string | Filter by class group          |

---

### 10. Leave Requests

**Base path:** `/api/leave-requests`

| Method | Endpoint                                | Role Required       | Description                  |
|--------|-----------------------------------------|---------------------|------------------------------|
| GET    | `/api/leave-requests`                   | 🔒 Any              | Get all leave requests       |
| GET    | `/api/leave-requests/summary/:studentId`| 🔒 Any              | Get student leave summary    |
| POST   | `/api/leave-requests`                   | 🔒 Any              | Submit leave request         |
| PUT    | `/api/leave-requests/:id/review`        | 🔒👑 Teacher/Admin  | Review (approve/reject) leave|

#### Example: POST /api/leave-requests
- **Content-Type:** `multipart/form-data`

| Field      | Type   | Required | Description                    |
|------------|--------|----------|--------------------------------|
| `student`  | string | ✅       | Student ObjectId               |
| `fromDate` | date   | ✅       | Leave start date               |
| `toDate`   | date   | ✅       | Leave end date                 |
| `reason`   | string | ✅       | Reason for leave               |
| `evidence` | file[] | ❌       | Supporting files (e.g. medical)|

#### Example: PUT /api/leave-requests/:id/review
```json
{
  "status": "approved",
  "note": "Medical evidence reviewed and accepted"
}
```

#### Leave Request Status Values

| Status     | Description              |
|------------|--------------------------|
| `pending`  | Awaiting review          |
| `approved` | Request approved         |
| `rejected` | Request rejected         |

---

### 11. Roles

**Base path:** `/api/roles`

| Method | Endpoint              | Role Required | Description          |
|--------|-----------------------|---------------|----------------------|
| GET    | `/api/roles`          | ❌ Public      | Get all roles        |
| GET    | `/api/roles/:id`      | 🔒 Any        | Get role by ID       |
| GET    | `/api/roles/:id/users`| 🔒👑 Admin    | Get users with role  |
| POST   | `/api/roles`          | ❌ Public      | Create new role      |
| PUT    | `/api/roles/:id`      | 🔒👑 Admin    | Update role          |
| DELETE | `/api/roles/:id`      | 🔒👑 Admin    | Delete role          |

#### Example: POST /api/roles
```json
{
  "roleName": "Admin",
  "roleDescription": "Full system administrator access"
}
```

---

## Data Models

### User
```json
{
  "_id": "ObjectId",
  "username": "String (unique)",
  "password": "String (hashed via bcrypt)",
  "email": "String (unique)",
  "role": "ObjectId → Role",
  "isActive": "Boolean",
  "createdAt": "Date"
}
```

### Student
```json
{
  "_id": "ObjectId",
  "user": "ObjectId → User",
  "classGroup": "ObjectId → ClassGroup",
  "firstName": "String",
  "lastName": "String",
  "dob": "Date",
  "gender": "male | female | other",
  "phone": "String",
  "photo": "String (URL)",
  "isBlacklisted": "Boolean"
}
```

### Teacher
```json
{
  "_id": "ObjectId",
  "user": "ObjectId → User",
  "subject": "ObjectId → Subject",
  "name": "String",
  "phone": "String"
}
```

### Subject
```json
{
  "_id": "ObjectId",
  "subjectName": "String",
  "subjectCode": "String",
  "description": "String",
  "teacherId": "ObjectId → Teacher",
  "credit": "Number (1–10)",
  "classGroups": ["ObjectId → ClassGroup"],
  "sessions": [
    {
      "days": ["Monday | Tuesday | Wednesday | Thursday | Friday | Saturday | Sunday"],
      "startTime": "HH:mm",
      "endTime": "HH:mm",
      "room": "String"
    }
  ]
}
```

### Attendance
```json
{
  "_id": "ObjectId",
  "student": "ObjectId → Student",
  "subject": "ObjectId → Subject",
  "date": "Date",
  "checkInTime": "Date",
  "checkOutTime": "Date",
  "status": "present | absent | late | half-day | on-leave | excused",
  "isLate": "Boolean",
  "lateBy": "Number (minutes)",
  "workHours": "Number",
  "markedByTeacher": "ObjectId → Teacher",
  "note": "String",
  "leaveReference": "ObjectId → LeaveRequest"
}
```

### LeaveRequest
```json
{
  "_id": "ObjectId",
  "student": "ObjectId → Student",
  "fromDate": "Date",
  "toDate": "Date",
  "reason": "String",
  "status": "pending | approved | rejected",
  "reviewedBy": "ObjectId → User",
  "reviewedAt": "Date",
  "requestedAt": "Date",
  "attachments": ["String (file paths)"]
}
```

### ClassGroup
```json
{
  "_id": "ObjectId",
  "groupName": "String",
  "description": "String"
}
```

### Role
```json
{
  "_id": "ObjectId",
  "roleName": "String",
  "roleDescription": "String",
  "createdAt": "Date"
}
```

---

## Developer Guidelines

### 1. Project Structure

```
backend/
├── server.js               # Entry point
├── .env                    # Environment variables
├── uploads/                # Uploaded files
└── src/
    ├── config/             # DB config
    ├── controllers/        # Business logic
    ├── middleware/          # auth.js, upload.js
    ├── models/             # Mongoose schemas
    ├── routes/             # API routes
    └── utils/              # Seed scripts, helpers
```

### 2. Environment Variables (.env)

```env
MONGODB_URI=mongodb://localhost:27017/attendance_db
JWT_SECRET=your_super_secret_key
PORT=4000
```

### 3. Running the Backend

```bash
cd backend
npm install
npm start        # Uses nodemon for hot reload
```

### 4. Adding a New API Endpoint

Follow this pattern:

**Step 1:** Create/update the Model in `src/models/`

**Step 2:** Create the Controller in `src/controllers/`
```js
exports.myFunction = async (req, res) => {
  try {
    // Business logic
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

**Step 3:** Create/update the Route in `src/routes/`
```js
router.get('/path', authMiddleware, roleCheck('Admin'), controller.myFunction);
```

**Step 4:** Register the route in `server.js`
```js
app.use('/api/my-resource', myRoutes);
```

### 5. Authentication Middleware Usage

```js
const { authMiddleware, roleCheck } = require('../middleware/auth');

// Protected route (any authenticated user)
router.get('/', authMiddleware, controller.func);

// Protected + Role restricted
router.post('/', authMiddleware, roleCheck('Admin', 'Teacher'), controller.func);
```

### 6. File Upload (Multer)

For multipart/form-data requests:
```js
const upload = require('../middleware/upload');

// Single file
router.post('/', upload.single('photo'), controller.func);

// Multiple files
router.post('/', upload.array('evidence'), controller.func);
```

### 7. Response Conventions

Always use consistent response format:

```js
// Success
res.status(200).json({ success: true, data: { ... } });
res.status(201).json({ success: true, message: 'Created', data: { ... } });

// Error
res.status(400).json({ success: false, message: 'Bad request reason' });
res.status(401).json({ success: false, message: 'Unauthorized' });
res.status(403).json({ success: false, message: 'Access denied' });
res.status(404).json({ success: false, message: 'Not found' });
res.status(500).json({ success: false, message: 'Internal Server Error' });
```

### 8. Date Handling

- Always store dates in **UTC ISO 8601** format: `"2026-02-25T08:00:00.000Z"`
- The system uses `moment` and `moment-timezone` for date manipulation
- Session times for subjects are stored as `"HH:mm"` strings (e.g., `"08:00"`)

### 9. Frontend API Service (Angular)

Base URL is defined in `frontend/src/environments/`:

```typescript
// Example service call
this.http.get(`${this.baseUrl}/attendance`, { headers: this.authHeaders() }).subscribe(...)
```

---

*This documentation was auto-generated from the codebase. Keep it updated when adding new endpoints.*
