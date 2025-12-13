System Attendance Student Managemnet
==========================
## II. Project Goal and Scope

### System: Attendance System

The Attendance System is designed to modernize and simplify how schools manage student attendance.

**Goals:**

* Reduce human error
* Make attendance faster and easier
* Keep records organized
* Improve monitoring for teachers
* Save time for teachers
* Improve overall school discipline

---

## III. Requirements

### 1. Main Modules

* Role Management Module
* User Management Module
* Attendance Module
* Student Module
* Teacher Module
* Subject Module
* Parent Module
* Leave Request Module
* Reporting & Dashboard Module

---

### 2. Module Details

#### Role Management Module

**Functions:**

* Assign roles to users
* CRUD operations

**Fields:**

* id (PK)
* roleName (varchar)
* roleDescription (varchar)
* createdAt (DateTime)

---

#### User Management Module

**Functions:**

* CRUD operations
* Login and authentication
* Logout and token removal
* Role and permission handling

**Fields:**

* id (PK)
* role_id (FK)
* username (varchar)
* email (varchar)
* password (varchar)
* is_active (boolean)
* createdAt (DateTime)

---

#### Attendance Module

**Functions:**

* Mark attendance (check-in / check-out)
* Record timestamps
* Handle late, absent, or manual updates

**Fields:**

* id (PK)
* student_id (FK)
* marked_by (teacher_id) (FK)
* status (boolean)
* checkInTime (DateTime)
* checkOutTime (DateTime)
* note (varchar)
* createdAt (DateTime)

---

#### Student Module

**Functions:**

* View attendance history
* View and update profile information
* Request attendance correction
* Optional parent view
* Blacklist checking

**Fields:**

* id (PK)
* user_id (FK)
* firstName (varchar)
* lastName (varchar)
* gender (varchar)
* dob (DateTime)
* photo (varchar)
* phone (varchar)
* isBlackList (boolean)
* createdAt (DateTime)

---

#### Teacher Module

**Functions:**

* View attendance list by class
* Mark attendance (present, absent, late)
* Approve attendance correction requests
* Send notes or feedback to students (optional)

**Fields:**

* id (PK)
* user_id (FK)
* subject_id (FK)
* name (varchar)
* phone (varchar)

---

#### Subject Module

**Functions:**

* Track class start and end time
* Assign teachers to specific subjects

**Fields:**

* id (PK)
* subjectName (varchar)
* start_time (DateTime)
* end_time (DateTime)

---

#### Parent Module

**Functions:**

* View child’s attendance history
* View monthly attendance reports

**Fields:**

* id (PK)
* parentName (varchar)
* phone (varchar)

---

#### Parent–Student View

**Functions:**

* Manage parent and student relationships

**Fields:**

* id (PK)
* parentId (FK)
* studentId (FK)
* createdAt (DateTime)

---

#### Leave Request Module

**Functions:**

* Submit and review leave requests

**Fields:**

* id (PK)
* student_id (FK)
* from_date (DateTime)
* to_date (DateTime)
* reason (varchar)
* status (boolean)
* request_at (DateTime)
* reviewedBy (FK)
* reviewedAt (DateTime)

---

#### Reporting & Dashboard Module

**Teacher Dashboard:**

* Generate attendance reports
* Student statistics
* Attendance trend charts

**Parent Dashboard:**

* Child’s attendance summary
* Monthly present, absent, late charts
* Simple daily attendance list

**Export Features:**

* Excel / CSV export
* Telegram bot integration

---

## IV. System Design

### Technology Stack

**Frontend:**

* Angular

**Backend:**

* Node.js

**Database:**

* MongoDB
