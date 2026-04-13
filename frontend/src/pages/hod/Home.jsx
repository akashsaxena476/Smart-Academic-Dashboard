import { useState, useEffect } from "react";
import HODLayout from "../../components/shared/HODLayout";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function HODHome() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const res = await API.get("/users/hod/overview/");
      setOverview(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const semesterLabels = {
    1: "Sem 1", 2: "Sem 2", 3: "Sem 3", 4: "Sem 4",
    5: "Sem 5", 6: "Sem 6", 7: "Sem 7", 8: "Sem 8"
  };

  const yearGroupLabel = () => {
    const years = [];
    if (user?.faculty_profile?.hod_year_1) years.push("1st Year");
    if (user?.faculty_profile?.hod_year_2) years.push("2nd Year");
    if (user?.faculty_profile?.hod_year_3) years.push("3rd Year");
    if (user?.faculty_profile?.hod_year_4) years.push("4th Year");
    return years.join(", ");
  };

  const pieData = overview ? [
    { name: "Safe (≥75%)", value: overview.total_students - overview.low_attendance_students },
    { name: "At Risk (<75%)", value: overview.low_attendance_students },
  ] : [];

  const COLORS = ["#10b981", "#f87171"];

  if (loading) return (
    <HODLayout>
      <div className="flex items-center justify-center h-64 text-gray-400">Loading overview...</div>
    </HODLayout>
  );

  return (
    <HODLayout>
      <div className="space-y-6">

        {/* Welcome Banner */}
       <div className="bg-gradient-to-r from-amber-700 to-amber-500 rounded-2xl p-6 text-white">
  <div className="flex items-start justify-between flex-wrap gap-4">
    <div>
      <h1 className="text-2xl font-bold text-white">Welcome, {user?.first_name}! 👋</h1>
      <p className="text-white/80 mt-1 text-sm">Head of Department — {overview?.department}</p>
      <div className="flex flex-wrap gap-2 mt-3">
        {overview?.semesters?.map(sem => (
          <span key={sem} className="bg-white/25 text-white text-xs px-3 py-1.5 rounded-full font-medium">
            {semesterLabels[sem]}
          </span>
        ))}
      </div>
    </div>
    <div className="bg-white/20 rounded-2xl px-5 py-3 text-center">
      <p className="text-2xl font-bold text-white">{yearGroupLabel()}</p>
      <p className="text-white/80 text-xs mt-1">Assigned Year Groups</p>
    </div>
  </div>
</div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Students", value: overview?.total_students, color: "text-indigo-600", bg: "bg-indigo-50", icon: "👥" },
            { label: "Faculty Members", value: overview?.total_faculty, color: "text-emerald-600", bg: "bg-emerald-50", icon: "👨‍🏫" },
            { label: "Total Sections", value: overview?.total_sections, color: "text-blue-600", bg: "bg-blue-50", icon: "🏫" },
            { label: "Total Subjects", value: overview?.total_subjects, color: "text-purple-600", bg: "bg-purple-50", icon: "📚" },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-500 text-xs font-medium">{card.label}</p>
                <span className={`text-2xl ${card.bg} w-10 h-10 rounded-xl flex items-center justify-center`}>{card.icon}</span>
              </div>
              <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Second Row Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Total Sessions Taken", value: overview?.total_sessions, color: "text-amber-600", icon: "📋" },
            { label: "Total Exams Conducted", value: overview?.total_exams, color: "text-pink-600", icon: "📝" },
            { label: "Students At Risk", value: overview?.low_attendance_students, color: "text-red-500", icon: "⚠️" },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{card.icon}</span>
                <div>
                  <p className="text-gray-500 text-xs font-medium">{card.label}</p>
                  <p className={`text-2xl font-bold text-black ${card.color} mt-0.5`}>{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Attendance Pie Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Overall Attendance Status</h3>
            {overview?.total_students > 0 ? (
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
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-sm text-gray-600">Safe: {overview.total_students - overview.low_attendance_students}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <span className="text-sm text-gray-600">At Risk: {overview.low_attendance_students}</span>
                  </div>
                  {overview.low_attendance_students > 0 && (
                    <p className="text-xs text-red-500 font-semibold mt-2">
                      ⚠️ {overview.low_attendance_students} student{overview.low_attendance_students > 1 ? "s" : ""} below 75%
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400 text-sm">No student data available</div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Department Quick Stats</h3>
            <div className="space-y-4">
              {[
                { label: "Avg Sessions per Subject", value: overview?.total_sessions && overview?.total_subjects ? Math.round(overview.total_sessions / overview.total_subjects) : 0, color: "bg-amber-500" },
                { label: "Students per Section", value: overview?.total_students && overview?.total_sections ? Math.round(overview.total_students / overview.total_sections) : 0, color: "bg-indigo-500" },
                { label: "Subjects per Faculty", value: overview?.total_subjects && overview?.total_faculty ? Math.round(overview.total_subjects / overview.total_faculty) : 0, color: "bg-emerald-500" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-4">
                  <div className={`w-2 h-10 rounded-full ${stat.color} flex-shrink-0`}></div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className="text-lg font-bold text-gray-800">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </HODLayout>
  );
}