import { useState, useEffect } from "react";
import HODLayout from "../../components/shared/HODLayout";
import API from "../../api/axios";

export default function HODStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [availableSemesters, setAvailableSemesters] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      let url = "/users/hod/students/?";
      if (semesterFilter) url += `semester=${semesterFilter}&`;
      if (sectionFilter) url += `section=${sectionFilter}&`;
      if (search) url += `search=${search}&`;
      const res = await API.get(url);
      setStudents(res.data);

      // Extract unique semesters from data
      const sems = [...new Set(res.data.map(s => s.semester))].sort();
      setAvailableSemesters(sems);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleClear = () => {
    setSearch("");
    setSemesterFilter("");
    setSectionFilter("");
    setTimeout(() => fetchStudents(), 100);
  };

  const atRiskCount = students.filter(s => s.is_at_risk).length;
  const safeCount = students.filter(s => !s.is_at_risk).length;

  return (
    <HODLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Students</h1>
          <p className="text-gray-500 text-sm mt-1">View and monitor all students in your year groups</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs font-medium">Total Students</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{students.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs font-medium">Safe (≥75%)</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{safeCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs font-medium">At Risk (&lt;75%)</p>
            <p className="text-3xl font-bold text-red-500 mt-1">{atRiskCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs font-medium">Avg Attendance</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">
              {students.length > 0
                ? Math.round(students.reduce((sum, s) => sum + s.overall_attendance, 0) / students.length)
                : 0}%
            </p>
          </div>
        </div>

        {/* At Risk Alert */}
        {atRiskCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-red-700 text-sm">
                {atRiskCount} student{atRiskCount > 1 ? "s are" : " is"} below 75% attendance
              </p>
              <p className="text-red-600 text-xs mt-1">
                These students may be ineligible for exams. Please take necessary action.
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <form onSubmit={handleFilter} className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search by name or enrollment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 flex-1 min-w-48"
            />
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Semesters</option>
              {availableSemesters.map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Sections</option>
              {["A", "B", "C", "D"].map(s => (
                <option key={s} value={s}>Section {s}</option>
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

        {/* Students Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Student List</h3>
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400 text-sm">Loading students...</div>
          ) : students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-6 py-3 text-gray-600 font-semibold">#</th>
                    <th className="text-left px-6 py-3 text-gray-600 font-semibold">Student</th>
                    <th className="text-left px-6 py-3 text-gray-600 font-semibold">Enrollment</th>
                    <th className="text-left px-6 py-3 text-gray-600 font-semibold">Semester</th>
                    <th className="text-left px-6 py-3 text-gray-600 font-semibold">Section</th>
                    <th className="text-left px-6 py-3 text-gray-600 font-semibold">Attendance</th>
                    <th className="text-left px-6 py-3 text-gray-600 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {students.map((student, idx) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-gray-500">{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                            ${student.is_at_risk ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>
                            {student.name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{student.name}</p>
                            <p className="text-xs text-gray-400">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{student.enrollment_number}</td>
                      <td className="px-6 py-4 text-gray-600">Sem {student.semester}</td>
                      <td className="px-6 py-4 text-gray-600">Section {student.section}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${student.overall_attendance >= 75 ? "bg-emerald-500" : "bg-red-400"}`}
                              style={{ width: `${student.overall_attendance}%` }}
                            ></div>
                          </div>
                          <span className={`text-sm font-bold ${student.overall_attendance >= 75 ? "text-emerald-600" : "text-red-500"}`}>
                            {student.overall_attendance}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {student.total_present}/{student.total_classes} classes
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {student.is_at_risk ? (
                          <span className="text-xs font-semibold bg-red-50 text-red-500 px-3 py-1 rounded-full">At Risk</span>
                        ) : student.total_classes > 0 ? (
                          <span className="text-xs font-semibold bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full">Safe</span>
                        ) : (
                          <span className="text-xs font-semibold bg-gray-50 text-gray-400 px-3 py-1 rounded-full">No Data</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <p className="text-5xl mb-3">👥</p>
              <p className="text-sm">No students found</p>
            </div>
          )}
        </div>

      </div>
    </HODLayout>
  );
}