import { useState, useEffect } from "react";
import FacultyLayout from "../../components/shared/FacultyLayout";
import API from "../../api/axios";

export default function FacultyStudents() {
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState(null);

  useEffect(() => {
    fetchSections();
    fetchSubjects();
  }, []);

  const fetchSections = async () => {
    try {
      const res = await API.get("/academics/sections/");
      setSections(res.data);
    } catch (err) {
      console.error(err);
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

  const fetchSummary = async (e) => {
    e.preventDefault();
    if (!selectedSection) return;
    setLoading(true);
    setSummaryData(null);
    try {
      let url = `/attendance/students-summary/?section_id=${selectedSection}`;
      if (selectedSubject) url += `&subject_id=${selectedSubject}`;
      const res = await API.get(url);
      setSummaryData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const atRiskCount = summaryData?.students?.filter(s => s.is_at_risk).length || 0;
  const safeCount = summaryData?.students?.filter(s => !s.is_at_risk && s.overall_total > 0).length || 0;

  return (
    <FacultyLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Student Attendance</h1>
          <p className="text-gray-500 text-sm mt-1">View attendance summary for all students</p>
        </div>

        {/* Filter Form */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <form onSubmit={fetchSummary} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                required
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-48"
              >
                <option value="">Select Section</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    Section {s.name} - Sem {s.semester}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject (Optional)</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-48"
              >
                <option value="">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Loading..." : "View Summary"}
            </button>
          </form>
        </div>

        {/* Summary Stats */}
        {summaryData && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-gray-500 text-xs font-medium">Section</p>
                <p className="text-lg font-bold text-gray-800 mt-1">{summaryData.section}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-gray-500 text-xs font-medium">Total Students</p>
                <p className="text-3xl font-bold text-indigo-600 mt-1">{summaryData.total_students}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-gray-500 text-xs font-medium">Safe (75%+)</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{safeCount}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-gray-500 text-xs font-medium">At Risk (below 75%)</p>
                <p className="text-3xl font-bold text-red-500 mt-1">{atRiskCount}</p>
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
                    These students may be ineligible for exams. Click on a student to see subject-wise details.
                  </p>
                </div>
              </div>
            )}

            {/* Students Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Student List</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  Click a student to expand details
                </span>
              </div>

              <div className="divide-y divide-gray-50">
                {summaryData.students.map((student) => (
                  <div key={student.student_id}>

                    {/* Student Row */}
                    <div
                      className={`px-6 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors
                        ${student.is_at_risk ? "border-l-4 border-red-400" : "border-l-4 border-green-400"}`}
                      onClick={() => setExpandedStudent(
                        expandedStudent === student.student_id ? null : student.student_id
                      )}
                    >
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0
                        ${student.is_at_risk ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                        {student.name[0]}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-800 text-sm">{student.name}</p>
                          {student.is_at_risk && (
                            <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">
                              At Risk
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {student.enrollment_number} • {student.branch} • Sem {student.semester}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 flex-shrink-0">
                        <div className="text-center hidden sm:block">
                          <p className="text-xs text-gray-500">Present</p>
                          <p className="text-sm font-bold text-green-600">{student.overall_present}</p>
                        </div>
                        <div className="text-center hidden sm:block">
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="text-sm font-bold text-gray-700">{student.overall_total}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Overall</p>
                          <p className={`text-sm font-bold ${student.overall_percentage >= 75 ? "text-green-600" : "text-red-500"}`}>
                            {student.overall_percentage}%
                          </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-24 hidden md:block">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${student.overall_percentage >= 75 ? "bg-green-500" : "bg-red-400"}`}
                              style={{ width: `${student.overall_percentage}%` }}
                            ></div>
                          </div>
                        </div>

                        <span className="text-gray-400 text-sm">
                          {expandedStudent === student.student_id ? "▲" : "▼"}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Subject-wise Details */}
                    {expandedStudent === student.student_id && (
                      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                          Subject-wise Attendance
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {student.subject_wise.map((sub) => (
                            <div key={sub.subject_id} className={`rounded-xl p-3 border ${sub.percentage >= 75 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="text-xs font-semibold text-gray-800">{sub.subject_name}</p>
                                  <p className="text-xs text-gray-500">{sub.subject_code}</p>
                                </div>
                                <span className={`text-sm font-bold ${sub.percentage >= 75 ? "text-green-600" : "text-red-500"}`}>
                                  {sub.percentage}%
                                </span>
                              </div>
                              <div className="h-1.5 bg-white rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${sub.percentage >= 75 ? "bg-green-500" : "bg-red-400"}`}
                                  style={{ width: `${sub.percentage}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1.5">
                                {sub.total_present}P / {sub.total_absent}A / {sub.total_classes} total
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!summaryData && !loading && (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <p className="text-5xl mb-3">👥</p>
            <p className="font-semibold text-gray-600">Select a section to view students</p>
            <p className="text-sm mt-1">Choose a section and optionally a subject above</p>
          </div>
        )}

      </div>
    </FacultyLayout>
  );
}