import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Student Pages
import StudentHome from "./pages/student/Home";
import StudentAttendance from "./pages/student/Attendance";
import StudentResources from "./pages/student/Resources";
import StudentMarks from "./pages/student/Marks";
import StudentTimetable from "./pages/student/Timetable";
import StudentProfile from "./pages/student/Profile";
import StudentNotices from "./pages/student/Notices";

// Faculty Pages
import FacultyHome from "./pages/faculty/Home";
import FacultyStudents from "./pages/faculty/Students";
import FacultyAttendance from "./pages/faculty/Attendance";
import FacultyResources from "./pages/faculty/Resources";
import FacultyMarks from "./pages/faculty/Marks";
import FacultyTimetable from "./pages/faculty/Timetable";
import FacultyProfile from "./pages/faculty/Profile";
import FacultyNotices from "./pages/faculty/Notices";

// HOD Pages
import HODHome from "./pages/hod/Home";
import HODStudents from "./pages/hod/Students";
import HODFaculty from "./pages/hod/Faculty";
import HODAttendance from "./pages/hod/Attendance";
import HODExams from "./pages/hod/Exams";
import HODProfile from "./pages/hod/Profile";
import HODNotices from "./pages/hod/Notices";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/login" />} />

{/* Student Routes */}
<Route path="/student/home" element={<ProtectedRoute role="student"><StudentHome /></ProtectedRoute>} />
<Route path="/student/attendance" element={<ProtectedRoute role="student"><StudentAttendance /></ProtectedRoute>} />
<Route path="/student/resources" element={<ProtectedRoute role="student"><StudentResources /></ProtectedRoute>} />
<Route path="/student/marks" element={<ProtectedRoute role="student"><StudentMarks /></ProtectedRoute>} />
<Route path="/student/timetable" element={<ProtectedRoute role="student"><StudentTimetable /></ProtectedRoute>} />
<Route path="/student/profile" element={<ProtectedRoute role="student"><StudentProfile /></ProtectedRoute>} />
<Route path="/student/notices" element={<ProtectedRoute role="student"><StudentNotices /></ProtectedRoute>} />

{/* Faculty Routes */}
<Route path="/faculty/students" element={<ProtectedRoute role="faculty"><FacultyStudents /></ProtectedRoute>} />
<Route path="/faculty/home" element={<ProtectedRoute role="faculty"><FacultyHome /></ProtectedRoute>} />
<Route path="/faculty/attendance" element={<ProtectedRoute role="faculty"><FacultyAttendance /></ProtectedRoute>} />
<Route path="/faculty/resources" element={<ProtectedRoute role="faculty"><FacultyResources /></ProtectedRoute>} />
<Route path="/faculty/marks" element={<ProtectedRoute role="faculty"><FacultyMarks /></ProtectedRoute>} />
<Route path="/faculty/timetable" element={<ProtectedRoute role="faculty"><FacultyTimetable /></ProtectedRoute>} />
<Route path="/faculty/profile" element={<ProtectedRoute role="faculty"><FacultyProfile /></ProtectedRoute>} />
<Route path="/faculty/notices" element={<ProtectedRoute role="faculty"><FacultyNotices /></ProtectedRoute>} />

{/* HOD Routes */}
<Route path="/hod/home" element={<ProtectedRoute role="faculty"><HODHome /></ProtectedRoute>} />
<Route path="/hod/students" element={<ProtectedRoute role="faculty"><HODStudents /></ProtectedRoute>} />
<Route path="/hod/faculty" element={<ProtectedRoute role="faculty"><HODFaculty /></ProtectedRoute>} />
<Route path="/hod/attendance" element={<ProtectedRoute role="faculty"><HODAttendance /></ProtectedRoute>} />
<Route path="/hod/exams" element={<ProtectedRoute role="faculty"><HODExams /></ProtectedRoute>} />
<Route path="/hod/profile" element={<ProtectedRoute role="faculty"><HODProfile /></ProtectedRoute>} />
<Route path="/hod/notices" element={<ProtectedRoute role="faculty"><HODNotices /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
    
  );
}