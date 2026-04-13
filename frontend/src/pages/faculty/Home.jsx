import { useState, useEffect } from "react";
import FacultyLayout from "../../components/shared/FacultyLayout";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ClipboardList, BookOpen, FileText, Library } from "../../components/shared/icons";

export default function FacultyHome() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [resources, setResources] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionsRes, resourcesRes, examsRes, subjectsRes] = await Promise.all([
          API.get("/attendance/faculty-sessions/"),
          API.get("/resources/faculty/"),
          API.get("/exams/faculty/"),
          API.get("/academics/subjects/"),
        ]);
        setSessions(sessionsRes.data);
        setResources(resourcesRes.data);
        setExams(examsRes.data);
        setSubjects(subjectsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Chart data - lectures per subject
  const chartData = subjects.map((s) => ({
    name: s.code,
    lectures: sessions.filter((sess) => sess.subject === s.id).length,
  }));

  if (loading) return (
    <FacultyLayout>
      <div className="flex items-center justify-center h-64 text-gray-500">Loading dashboard...</div>
    </FacultyLayout>
  );

  return (
    <FacultyLayout>
      <div className="space-y-6">

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
          <h1 className="text-2xl font-bold text-white">Welcome, {user?.first_name}!</h1>
          <p className="text-emerald-200 mt-1 text-sm">Here's your teaching activity overview.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 text-sm font-medium">Total Lectures</p>
              <ClipboardList className="w-7 h-7 text-emerald-500" strokeWidth={2} />
            </div>
            <p className="text-3xl font-bold text-emerald-600">{sessions.length}</p>
            <p className="text-xs text-gray-400 mt-1">Sessions conducted</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 text-sm font-medium">Resources Shared</p>
              <BookOpen className="w-7 h-7 text-indigo-500" strokeWidth={2} />
            </div>
            <p className="text-3xl font-bold text-indigo-600">{resources.length}</p>
            <p className="text-xs text-gray-400 mt-1">Files uploaded</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 text-sm font-medium">Exams Created</p>
              <FileText className="w-7 h-7 text-purple-500" strokeWidth={2} />
            </div>
            <p className="text-3xl font-bold text-purple-600">{exams.length}</p>
            <p className="text-xs text-gray-400 mt-1">Total exams</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 text-sm font-medium">Subjects Teaching</p>
              <Library className="w-7 h-7 text-teal-500" strokeWidth={2} />
            </div>
            <p className="text-3xl font-bold text-teal-600">{subjects.length}</p>
            <p className="text-xs text-gray-400 mt-1">Assigned subjects</p>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-gray-800 font-semibold mb-4">Lectures Conducted per Subject</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="lectures" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Activity Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Recent Sessions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-gray-800 font-semibold mb-4">Recent Sessions</h3>
            {sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="bg-emerald-100 text-emerald-600 w-9 h-9 rounded-lg flex items-center justify-center">
                      <ClipboardList className="w-4 h-4" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{s.subject_name}</p>
                      <p className="text-xs text-gray-500">Section {s.section_name} • {s.date}</p>
                    </div>
                    <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-lg">
                      {s.total_present}P / {s.total_absent}A
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">No sessions yet</p>
            )}
          </div>

          {/* Recent Resources */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-gray-800 font-semibold mb-4">Recently Uploaded</h3>
            {resources.length > 0 ? (
              <div className="space-y-3">
                {resources.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="bg-indigo-100 text-indigo-600 w-9 h-9 rounded-lg flex items-center justify-center text-sm">📄</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                      <p className="text-xs text-gray-500">{r.subject_name}</p>
                    </div>
                    <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded-lg capitalize">
                      {r.resource_type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">No resources uploaded yet</p>
            )}
          </div>

        </div>
      </div>
    </FacultyLayout>
  );
}