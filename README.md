System Attendance Student Managemnet
==========================
II Define Project Goal And Scope
 System: Attendance System
 =========================
 	- Reduce Human Error
 	- Make attendance faster and easier
 	- Keep record organized
 	- Improve monitoring  (make teacher more easier to see attendance)
 	- save times for teacher
 	- Improve School discipline
 
III Requirement

 	1.Main Module:
 		+ Role Management Module
 		+ User Management Module
 		+ Attendance Module
 		+ Student Module
 		+ Teacher Module
 		+ Subject Module
 		+ Parent Module
 		+ LeaveRequest Module
 		+ Reporting & Dashboard Module
 	2.Module Details
 		+Role Management Module
 			- Assign Role For user
 			- CRUD =>(
 				id-pk
 				roleName-varchar
 				roledescription-varchar
 				createAt-DateTime
 				)
 		+ User Management Module
 			-CRUD =>(
 				id-pk
 				role_id-fk
 				username-varchar
 				email-varchar
 				password-varchar
 				is_active-boolean
 				createAt-DateTime
 			)
 			- Login and authentication => (Fn)
 			- logOut and Remove Token => (Fn)
 			- Roles and permissions => (Fn)
 		+ Attendance Module
 			- cru =>(
 				id-pk*
 				student_id-fk*
 				mark_by(teacher_id)-fk*
 				status-boolean
 				checkInTime-DateTime*
 				checkOutTime-DateTime*
 				note-varchar
 				createAt-DateTime
 				)
 			- Mark attendance (student check-in/check-out) => (Fn)
 			- Record timestamps => (Fn).
 			- Handle late, absent, or manual updates => (Fn).
 	 	+ Student Module
 			- Crud =>(
 				id-pk*
 				user_id-fk*
 				firstName-varchar*
 				lasttName-varchar*
 				gender-varchar
 				dob-DateTime
 				photo-varchar
 				phone-varchar
 				isBlackList-boolean
 				createAt-DateTime
 				)
 			- Student attendance history => (Fn).
 			- Profile info => (Fn).
 			- Request attendance correction => (Fn)
 			- Optional: Parent view => (Fn).
 			- Blacklist Check => (Fn).
 		+ Teacher Module
 			- Crud =>(
 				id-pk*
 				user_id-fk*
 				subject_id-fk*
 				name-varchar
 				phone-varchar
 				)
 			- View attendance list for each class => (Fn).
 			- Mark attendance (present, absent, late) => (Fn).
 			- Approve attendance corrections from students => (Fn).
 			- Send notes or feedback to students (optional) => (fn).
 		+ Subject Module
 			- create and Delete =>(
 				id-pk*
 				subjectName-varchar*
 				teach_time-DateTime
 				end_time-DateTime
 				)
 			- Tracking Start_time and End_time of class Subject => (Fn)
 			- Assign teachers with Specific Subject(Fn)
 		+ Parent Module
 			- CRUD =>(
 				id-pk*
 				parentName-varchar*
 				phone-varchar
 				)
 			- View their child’s attendance history => (Fn).
 			- View simple reports showing monthly attendance => (Fn).
 		+ ParentStudentView
 			- CRUD =>(
 				id-pk
 				parentId-pk*
 				studentId-Pk*
 				createdAt-DateTime
 				)
 		+ LeaveRequest Module
 			-CRUD =>(
 				id-pk*
 				student_id-fk*
 				from_date-DateTime
 				to_date-DateTime
 				reason-varchar
 				status-boolean
 				request_at-DateTime
 				reviewBy-fk
 				reviewAt-DateTime
 				)
 		+ Reporting & Dashboard Module
 				. Teacher Dashboard => (FN):
 					- Generate attendance reports.
 					- student statistics.
 					- Charts for trends.
 				. Parents Dashboard => (FN)
 					- Child’s attendance summary.
 					- Monthly chart of present/absent/late.
 					- Simple daily list view.
 				+ Export functionality => (FN):
 					- Excell Files => (CSV)
 					- Telegram Bot Integration
IV Design System

 	+Technology Stack
 		- Frontend
 			. Angular
 		- Backend
 			. NodeJs
 		- Database
 			. MongoDB
