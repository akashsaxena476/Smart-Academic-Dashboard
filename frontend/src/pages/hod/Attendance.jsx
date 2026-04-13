import { useState, useEffect } from "react";
import HODLayout from "../../components/shared/HODLayout";
import API from "../../api/axios";

export default function HODAttendance() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semesterFilter, setSemesterFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    fetchAttendance();
    fetchSubjects();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      let url = "/users/hod/attendance/?";
      if (semesterFilter) url += `semester=${semesterFilter}&`;
      if (subjectFilter) url += `subject_id=${subjectFilter}&`;
      const res = await API.get(url);
      setAttendanceData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await API.get("/academics/subjects/");
      setSubjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchAttendance();
  };

  const handleClear = () => {
    setSemesterFilter("");
    setSubjectFilter("");
    setTimeout(() => fetchAttendance(), 100);
  };

  const getAvgColor = (avg) => {
    if (avg >= 75) return "text-emerald-600";
    if (avg >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const getBgColor = (avg) => {
    if (avg >= 75) return "bg-emerald-500";
    if (avg >= 60) return "bg-amber-400";
    return "bg-red-400";
  };

  return (
    <HODLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Attendance Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Section and subject wise attendance summary</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <form onSubmit={handleFilter} className="flex flex-wrap gap-3">
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Semesters</option>
              {[1,2,3,4,5,6,7,8].map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              Filter
            </button>
            <button type="button" onClick={handleClear}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              Clear
            </button>
          </form>
        </div>

        {/* Attendance Data */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading attendance data...</div>
        ) : attendanceData.length > 0 ? (
          <div className="space-y-4">
            {attendanceData.map((section) => (
              <div key={section.section_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                {/* Section Header */}
                <div
                  className="px-6 py-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors"
                  onClick={() => setExpandedSection(expandedSection === section.section_id ? null : section.section_id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-600 text-white w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm">
                      {section.section_name[8]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{section.section_name}</h3>
                      <p className="text-xs text-gray-500">{section.total_students} students • {section.subjects.length} subjects</p>
                    </div>
                  </div>
                  <span className="text-gray-400">{expandedSection === section.section_id ? "▲" : "▼"}</span>
                </div>

                {/* Subject Cards */}
                {expandedSection === section.section_id && (
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {section.subjects.map((sub) => (
                      <div key={sub.subject_id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-800 text-sm truncate">{sub.subject_name}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">{sub.subject_code}</p>
                            <p className="text-xs text-gray-400 mt-0.5">by {sub.faculty_name}</p>
                          </div>
                          <span className={`text-lg font-bold ${getAvgColor(sub.average_attendance)} flex-shrink-0 ml-2`}>
                            {sub.average_attendance}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getBgColor(sub.average_attendance)}`}
                            style={{ width: `${sub.average_attendance}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">{sub.total_sessions} sessions conducted</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <p className="text-5xl mb-3">📋</p>
            <p className="text-sm">No attendance data found</p>
          </div>
        )}

      </div>
    </HODLayout>
  );
}