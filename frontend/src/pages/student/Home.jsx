import { useState, useEffect } from "react";
import StudentLayout from "../../components/shared/StudentLayout";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ClipboardList, BookOpen, BarChart3, AlertTriangle } from "lucide-react";

const COLORS = ["#6366f1", "#e0e7ff"];

export default function StudentHome() {
  const { user } = useAuth();
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [recentResources, setRecentResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attendanceRes, resultsRes, resourcesRes] = await Promise.all([
          API.get("/attendance/my-summary/"),
          API.get("/exams/my-results/"),
          API.get("/resources/student/"),
        ]);
        setAttendanceSummary(attendanceRes.data);
        setRecentResults(resultsRes.data.slice(0, 5));
        setRecentResources(resourcesRes.data.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const overallAttendance = attendanceSummary.length > 0
    ? Math.round(attendanceSummary.reduce((sum, s) => sum + s.attendance_percentage, 0) / attendanceSummary.length)
    : 0;

  const pieData = [
    { name: "Present", value: overallAttendance },
    { name: "Absent", value: 100 - overallAttendance },
  ];

  if (loading) return (
    <StudentLayout>
      <div className="flex items-center justify-center h-64 text-gray-500">Loading dashboard...</div>
    </StudentLayout>
  );

  return (
    <StudentLayout>
      <div className="space-y-6">

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
          <h1 className="text-2xl font-bold text-white">Welcome back, {user?.first_name}!</h1>
          <p className="text-indigo-200 mt-1 text-sm">Here's your academic overview for today.</p>
        </div>
        {/* Low Attendance Warning */}
{attendanceSummary.filter(s => s.attendance_percentage < 75).length > 0 && (
  <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
    <div className="flex items-start gap-3">
      <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" strokeWidth={2} />
      <div className="flex-1">
        <h3 className="font-semibold text-red-700 text-sm">
          Low Attendance Alert — Immediate Action Required!
        </h3>
        <p className="text-red-600 text-xs mt-1 mb-3">
          You are below 75% attendance in the following subjects. This may affect your eligibility to appear in exams.
        </p>
        <div className="flex flex-wrap gap-2">
          {attendanceSummary
            .filter(s => s.attendance_percentage < 75)
            .map(s => (
              <div key={s.subject_id} className="bg-white border border-red-200 rounded-xl px-3 py-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-xs font-semibold text-red-700">{s.subject_name}</span>
                <span className="text-xs font-bold text-red-500">{s.attendance_percentage}%</span>
              </div>
            ))
          }
        </div>
        <p className="text-red-500 text-xs mt-3 font-medium">
          Minimum required attendance: 75%
        </p>
      </div>
    </div>
  </div>
)}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 text-sm font-medium">Overall Attendance</p>
              <ClipboardList className="w-7 h-7 text-indigo-500" strokeWidth={2} />
            </div>
            <p className={`text-3xl font-bold ${overallAttendance >= 75 ? "text-green-600" : "text-red-500"}`}>
              {overallAttendance}%
            </p>
            <p className="text-xs text-gray-400 mt-1">Across all subjects</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 text-sm font-medium">Resources Available</p>
              <BookOpen className="w-7 h-7 text-indigo-500" strokeWidth={2} />
            </div>
            <p className="text-3xl font-bold text-indigo-600">{recentResources.length}</p>
            <p className="text-xs text-gray-400 mt-1">Shared by faculty</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 text-sm font-medium">Exams Recorded</p>
              <BarChart3 className="w-7 h-7 text-purple-500" strokeWidth={2} />
            </div>
            <p className="text-3xl font-bold text-purple-600">{recentResults.length}</p>
            <p className="text-xs text-gray-400 mt-1">Results available</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Pie Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-gray-800 font-semibold mb-4">Overall Attendance</h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                    {pieData.map((_, index) => <Cell key={index} fill={COLORS[index]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                  <span className="text-sm text-gray-600">Present: {overallAttendance}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-100"></div>
                  <span className="text-sm text-gray-600">Absent: {100 - overallAttendance}%</span>
                </div>
                <p className={`text-xs font-semibold mt-2 ${overallAttendance >= 75 ? "text-green-600" : "text-red-500"}`}>
                  {overallAttendance >= 75 ? "✅ Good Standing" : "⚠️ Below 75% - At Risk"}
                </p>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-gray-800 font-semibold mb-4">Subject-wise Attendance</h3>
            {attendanceSummary.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={attendanceSummary} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="subject_code" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => [`${value}%`, "Attendance"]} />
                  <Bar dataKey="attendance_percentage" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                No attendance data yet
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Recent Resources */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-gray-800 font-semibold mb-4">Recent Resources</h3>
            {recentResources.length > 0 ? (
              <div className="space-y-3">
                {recentResources.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="bg-indigo-100 text-indigo-600 w-9 h-9 rounded-lg flex items-center justify-center text-sm">📄</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                      <p className="text-xs text-gray-500">{r.subject_name}</p>
                    </div>
                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg capitalize">{r.resource_type}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">No resources shared yet</p>
            )}
          </div>

          {/* Recent Results */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-gray-800 font-semibold mb-4">Recent Exam Results</h3>
            {recentResults.length > 0 ? (
              <div className="space-y-3">
                {recentResults.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="bg-purple-100 text-purple-600 w-9 h-9 rounded-lg flex items-center justify-center text-sm">📝</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{r.exam_title}</p>
                      <p className="text-xs text-gray-500">{r.subject_name}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${r.is_passed ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                      {r.is_absent ? "Absent" : `${r.marks_obtained}/${r.max_marks}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">No results available yet</p>
            )}
          </div>

        </div>
      </div>
    </StudentLayout>
  );
}