🎓 Smart Academic Dashboard
A full-stack web application that connects students, faculty, and HOD on a single unified portal for managing attendance, study resources, exam marks, timetables, notices, and more — built as a college major project.

📌 Table of Contents

Project Overview
Tech Stack
Project Structure
User Roles
Features
Database Models
API Endpoints
Installation & Setup
Configuration
Testing Guide
Known Limitations
Future Enhancements


📖 Project Overview
Smart Academic Dashboard replaces scattered college systems with one clean portal. Students can view their attendance, download study materials, check exam results, and track their timetable. Faculty can mark attendance, upload resources, publish exam marks, and monitor student performance. HODs can oversee their entire department — students, faculty, attendance, and exam results — and send notices to faculty members.
Key highlights:

Single login page with automatic role-based redirection
Students self-register with password strength validation
Faculty and HOD accounts created by Super Admin
Real-time notifications when resources are uploaded or marks are published
HOD notice board — send notices to all or specific faculty
Downloadable attendance reports in Excel and marks reports in PDF
Low attendance warning system — alerts students below 75%
Fully responsive design — works on desktop, tablet, and mobile


🛠 Tech Stack
Backend
TechnologyVersionPurposePython3.xProgramming languageDjango5.xWeb frameworkDjango REST Framework3.15.2REST API layerdjangorestframework-simplejwt5.3.1JWT Authenticationdjango-cors-headers4.6.0Cross-origin resource sharingPillow11.xImage/file handlingopenpyxl3.1.5Excel report generationreportlab4.2.5PDF report generationdjango-jazzmin2.6.0Admin panel UI themeSQLite—Database (development)
Frontend
TechnologyVersionPurposeReact18.xUI frameworkVite6.xBuild toolTailwind CSS4.xStylingReact Router DOM6.xClient-side routingAxios1.xHTTP clientRecharts2.xCharts and graphsLucide React0.383.0Icon library

📁 Project Structure
college/
│
├── backend/
│   ├── core/                  ← Django project (settings, urls, wsgi)
│   ├── users/                 ← CustomUser, StudentProfile, FacultyProfile, HOD views
│   ├── academics/             ← Department, Subject, Section, Timetable
│   ├── attendance/            ← AttendanceSession, AttendanceRecord, Excel export
│   ├── resources/             ← Resource, ResourceView
│   ├── exams/                 ← Exam, ExamResult, PDF export
│   ├── notifications/         ← Notification (bell system)
│   ├── notices/               ← Notice, NoticeRead (HOD notice board)
│   ├── media/                 ← Uploaded files
│   ├── manage.py
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── api/
        │   └── axios.js              ← Axios with JWT interceptors + auto refresh
        ├── context/
        │   └── AuthContext.jsx       ← Global auth state
        ├── routes/
        │   └── ProtectedRoute.jsx    ← Role-based route protection
        ├── components/
        │   └── shared/
        │       ├── StudentLayout.jsx     ← Indigo theme sidebar + navbar
        │       ├── FacultyLayout.jsx     ← Emerald theme sidebar + navbar
        │       ├── HODLayout.jsx         ← Amber theme sidebar + navbar
        │       └── NotificationBell.jsx  ← Bell with dropdown
        └── pages/
            ├── auth/
            │   ├── Login.jsx         ← Single login with role redirect
            │   └── Register.jsx      ← 2-step registration + password strength
            ├── student/
            │   ├── Home.jsx
            │   ├── Attendance.jsx
            │   ├── Resources.jsx
            │   ├── Marks.jsx
            │   ├── Timetable.jsx
            │   └── Profile.jsx
            ├── faculty/
            │   ├── Home.jsx
            │   ├── Attendance.jsx
            │   ├── Resources.jsx
            │   ├── Marks.jsx
            │   ├── Timetable.jsx
            │   ├── Students.jsx
            │   ├── Notices.jsx
            │   └── Profile.jsx
            └── hod/
                ├── Home.jsx
                ├── Students.jsx
                ├── Faculty.jsx
                ├── Attendance.jsx
                ├── Exams.jsx
                ├── Notices.jsx
                └── Profile.jsx

👥 User Roles
RoleTheme ColorAccessAccount CreationSuper Admin—Full Django Admin panelpython manage.py createsuperuserStudentIndigoStudent DashboardSelf-registration at /registerFacultyEmeraldFaculty DashboardCreated by Super AdminHODAmberHOD DashboardFaculty with is_hod=True in FacultyProfile
HOD Year Group System
HODs are assigned year groups via boolean fields in FacultyProfile:

hod_year_1 → Manages Semester 1 & 2 students
hod_year_2 → Manages Semester 3 & 4 students
hod_year_3 → Manages Semester 5 & 6 students
hod_year_4 → Manages Semester 7 & 8 students

A HOD can be assigned multiple year groups simultaneously.
Login Redirect Logic
javascriptif (role === "student") → /student/home
if (role === "faculty" && is_hod) → /hod/home
if (role === "faculty" && !is_hod) → /faculty/home

✨ Features
🔐 Authentication & Security

Single login page for all users
JWT authentication — 8 hour access token, 7 day refresh token
Auto token refresh on expiry — seamless login experience
Role-based protected routes
Student self-registration with 2-step form
Password strength validation:

Minimum 8 characters
At least 1 uppercase letter
At least 1 lowercase letter
At least 1 number
At least 1 special character
Live strength indicator (Very Weak → Very Strong) with 5 colored bars
Real-time checklist showing which requirements are met
Confirm password field turns green when passwords match




🧑‍🎓 Student Dashboard
Home:

Summary cards: overall attendance %, resources available, exam results count
Pie chart: overall present vs absent
Bar chart: subject-wise attendance
Low attendance alert: red banner listing subjects below 75%
Recent resources and recent exam results sections

Attendance:

Subject-wise summary cards with color-coded progress bars
Bar chart with dual color coding (green ≥75%, red <75%)
Detailed history table: date, subject, topic, time, status
Filter by subject and date range
Recovery calculator: "Attend next X consecutive classes to reach 75%"

Resources:

Files grouped by subject automatically
Resource types: Notes, Assignment, Reference, Previous Year Questions, Other
Stats bar showing count per type
Filter by subject and type, search by title
Download/View button — marks resource as viewed

Exam Marks:

Summary cards: total exams, appeared, passed, average %
Performance bar chart with pass/fail color coding
Results grouped by subject with filter by subject and exam type

Timetable:

Week view showing all 6 days with color-coded cards per day
Today view showing only today's classes
Today's day highlighted with colored border and pulsing dot

Profile:

Academic info: enrollment number, branch, semester, section, DOB
Edit personal info: name, email, phone
Change password with validation


👨‍🏫 Faculty Dashboard
Home:

Summary cards: lectures conducted, resources shared, exams created, subjects
Bar chart: lectures per subject
Recent sessions and recent resources

Attendance:

Mark Attendance tab: select subject/section/date/time, student list loads automatically, click to toggle present/absent, Mark All buttons, live present/absent counter
Session History tab: table of all past sessions
Download Report tab: Excel export with filters (subject, section, date range) — styled with colors, P/A columns, percentage color coding, frozen headers, legend

Resources:

Upload tab: title, description, subject, type, file upload
Manage tab: filter, view, edit inline, delete with confirmation

Exam Marks:

Create Exam tab: title, type, subject, section, date, max marks, passing marks
Enter/View Results tab: per-student marks entry with absent checkbox and remarks
PDF download: landscape A4, styled headers, stats row, color-coded results table

Timetable:

Week view + today view with subject color legend
Summary banner: today's classes, total weekly classes, subjects count

Students:

Select section to view all students
Overall attendance % with progress bar and at-risk badges
Click to expand subject-wise attendance breakdown per student

Notice Board:

View notices from HOD
Unread indicator (pulsing amber dot)
Auto-marks as read when expanded
Filter: All / Unread / Read

Profile:

Faculty info: employee ID, department, designation, joining date
Edit personal info and change password


🏫 HOD Dashboard
Home:

Welcome banner with assigned semesters shown as badges
Summary cards: total students, faculty, sections, subjects, sessions, exams, at-risk students
Pie chart: safe vs at-risk students
Quick stats: avg sessions per subject, students per section, subjects per faculty

Students:

All students in HOD's year groups
Filter by semester, section, search by name/enrollment
Summary cards: total, safe, at-risk, average attendance
Table with attendance %, progress bar, at-risk badge

Faculty:

All faculty teaching in HOD's year groups
Summary: total faculty, subjects covered, sessions taken
Click to expand subjects each faculty teaches

Attendance:

Section-wise view with expand to see subject-wise average attendance
Filter by semester and subject
Color-coded progress bars (green ≥75%, yellow 60-75%, red <75%)

Exam Results:

All exams across HOD's year groups
Filter by semester and exam type
Table: exam name, type, subject, section, faculty, date, max marks, appeared, passed, average, pass %
Color-coded pass percentage

Notice Board:

Create Notice tab: title, content, send to All Faculty or Specific Faculty
Specific faculty selection with checkbox list
Sent Notices tab: view, expand, delete sent notices
Auto-creates notification in faculty bell when notice is sent

Profile:

HOD info: employee ID, department, designation, joining date
Assigned year groups displayed as badges
Edit personal info and change password


🔔 Notification Bell

Available in all 3 dashboards (Student, Faculty, HOD)
Red badge showing unread count (9+ for large counts)
Dropdown with last 20 notifications
Icons by type: 📚 resource, 📊 marks, 🔔 general
Time ago display (just now, 2h ago, 3d ago)
Click to mark as read, Mark All Read button
Auto-polls every 30 seconds
Auto-created when:

Faculty uploads a resource → enrolled students notified
Faculty enters marks → specific student notified with marks
HOD sends a notice → all recipient faculty notified




📊 Charts & Visualizations

Student Home: Pie chart (overall attendance) + Bar chart (subject-wise)
Student Attendance: Bar chart (dual color — safe vs at-risk)
Student Marks: Bar chart (exam performance — pass/fail coloring)
Faculty Home: Bar chart (lectures per subject)
HOD Home: Pie chart (safe vs at-risk students)


📱 Responsive Design

Sidebar becomes slide-in drawer on mobile with dark overlay
Hamburger menu button on mobile only
Grids collapse: 4 columns → 2 columns → 1 column
Tables horizontally scrollable on small screens
Compact navbar on mobile


🗄 Database Models
users app

CustomUser (extends AbstractUser) — role (student/faculty/admin), phone, profile_pic
StudentProfile — enrollment_number, branch, semester, section, date_of_birth, address
FacultyProfile — employee_id, department, designation, joining_date, is_hod, hod_year_1, hod_year_2, hod_year_3, hod_year_4

academics app

Department — name, code
Subject — name, code, semester, department (FK), faculty (FK), credits
Section — name, semester, department (FK), students (M2M)
Timetable — section (FK), subject (FK), day, start_time, end_time

attendance app

AttendanceSession — faculty, subject, section, date, start_time, topic_covered (unique: subject+section+date+start_time)
AttendanceRecord — session, student, status (present/absent) (unique: session+student)

resources app

Resource — title, description, resource_type, file, subject, section, uploaded_by, uploaded_at, is_active
ResourceView — resource, student, viewed_at (unique: resource+student)

exams app

Exam — title, exam_type, subject, section, conducted_by, date, max_marks, passing_marks
ExamResult — exam, student, marks_obtained, is_absent, remarks, entered_by (unique: exam+student)

notifications app

Notification — recipient, title, message, notification_type, is_read, created_at

notices app

Notice — title, content, sent_by, recipient_type (all/specific), specific_recipients (M2M), is_active, created_at
NoticeRead — notice, faculty, read_at (unique: notice+faculty)


🔌 API Endpoints
Users — /api/users/
MethodEndpointDescriptionAuthPOST/register/Student registrationNoPOST/login/Login — returns JWT + user dataNoPOST/token/refresh/Refresh access tokenNoGET/profile/Get full profileYesPUT/profile/update/Update personal infoYesPOST/change-password/Change passwordYesGET/hod/overview/HOD department overview statsHODGET/hod/students/All students in HOD's year groupsHODGET/hod/faculty/All faculty in HOD's year groupsHODGET/hod/attendance/Section-wise attendance overviewHODGET/hod/exams/All exams in HOD's year groupsHOD
Academics — /api/academics/
MethodEndpointDescriptionAuthGET/departments/List departmentsYesGET/subjects/List subjects by roleYesGET/sections/List all sectionsYesGET/student-timetable/Student's timetableStudentGET/faculty-timetable/Faculty's timetableFaculty
Attendance — /api/attendance/
MethodEndpointDescriptionAuthPOST/create-session/Mark attendanceFacultyGET/section-students/Students in a sectionFacultyGET/PUT/session/<id>/View/update sessionFacultyGET/faculty-sessions/Faculty's sessionsFacultyGET/my-summary/Student attendance summaryStudentGET/my-detail/Student attendance historyStudentGET/students-summary/All students' attendanceFacultyGET/download-excel/Download Excel reportFaculty
Resources — /api/resources/
MethodEndpointDescriptionAuthPOST/upload/Upload resourceFacultyGET/faculty/Faculty's resourcesFacultyGET/PUT/DELETE/<id>/View/edit/delete resourceFacultyGET/student/Student's resourcesStudentPOST/<id>/viewed/Mark as viewedStudent
Exams — /api/exams/
MethodEndpointDescriptionAuthPOST/create/Create examFacultyGET/PUT/DELETE/<id>/View/edit/delete examFacultyPOST/<id>/results/Enter marksFacultyGET/faculty/Faculty's examsFacultyGET/my-results/Student's resultsStudentGET/my-summary/Student's exam summaryStudentGET/download-pdf/Download PDF reportFaculty
Notifications — /api/notifications/
MethodEndpointDescriptionAuthGET/Get notifications + unread countYesPUT/<id>/read/Mark as readYesPUT/mark-all-read/Mark all as readYes
Notices — /api/notices/
MethodEndpointDescriptionAuthPOST/create/Create noticeHODGET/hod/HOD's sent noticesHODDELETE/<id>/delete/Delete noticeHODGET/faculty/Faculty's received noticesFacultyPUT/<id>/read/Mark notice as readFaculty

🚀 Installation & Setup
Prerequisites

Python 3.10–3.12 recommended
Node.js 18+
npm 9+

Backend Setup
bashcd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
Frontend Setup
bashcd frontend
npm install
npm run dev
Backend runs at http://127.0.0.1:8000/
Frontend runs at http://localhost:5173/

⚙️ Configuration
Key settings.py settings:
pythonAUTH_USER_MODEL = 'users.CustomUser'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=8),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}

CORS_ALLOW_ALL_ORIGINS = True  # Development only
TIME_ZONE = 'Asia/Kolkata'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Jazzmin must be FIRST in INSTALLED_APPS
INSTALLED_APPS = [
    'jazzmin',
    'django.contrib.admin',
    ...
]
Key axios.js setting:
javascriptbaseURL: 'http://127.0.0.1:8000/api'

🧪 Testing Guide
Admin Setup

Go to http://127.0.0.1:8000/admin/
Create Department: Computer Science (CS)
Create Faculty user: role=faculty, create FacultyProfile with employee ID
Create HOD: same as faculty but check is_hod=True and check year group boxes
Create Subjects: DS601, CN602, OS603, WT604 — Sem 6, CS dept, faculty assigned
Register Student: go to /register, fill Sem 6, CS, Section A
Create Section: Name A, Sem 6, CS — add student to Students field
Add Timetable entries for each subject on different days

Testing Password Restrictions
Go to /register → Step 1 → type in password field:

abc → Very Weak, all red ✗
Abc1@123 → Very Strong, all green ✓
Mismatched confirm → red border with ✗
Matched confirm → green border with ✓

Testing Faculty Flow
Login as faculty → Mark attendance → Upload resources → Create exams → Enter marks → Download Excel/PDF
Testing Student Flow
Login as student → Check home charts and low attendance warning → View attendance with recovery calculator → Download resources → Check marks
Testing HOD Flow
Login as HOD → Check overview stats → View students list → View faculty → Check attendance overview → View exam results → Send notice to all faculty
Testing Notices
HOD sends notice → Login as faculty → Go to Notice Board → Notice appears with pulsing amber dot → Click to expand → Marks as read automatically → Bell notification also appears

🔒 Security Notes

DEBUG = True — development only, set False in production
CORS_ALLOW_ALL_ORIGINS = True — development only, restrict in production
SECRET_KEY — change and store as environment variable in production
JWT tokens in localStorage — suitable for college project demo
File uploads stored locally — use cloud storage in production


🧩 Known Limitations

SQLite — not suitable for high-traffic production
No email verification on registration
No forgot password via email
Notifications use polling (30 seconds) instead of WebSockets
Pillow may have issues with Python 3.14 on Windows — use Python 3.11/3.12


🚀 Future Enhancements

Dark mode toggle
Assignment submission system
Email notifications for low attendance
PostgreSQL for production
WebSocket real-time notifications
Docker containerization
Mobile app with React Native

Built with ❤️ using Django + React | College Major Project 2025-2026