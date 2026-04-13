import { useState, useEffect } from "react";
import HODLayout from "../../components/shared/HODLayout";
import API from "../../api/axios";

const examTypeLabels = {
  sessional1: "Sessional 1", sessional2: "Sessional 2",
  endsem: "End Semester", practical: "Practical",
  assignment: "Assignment", other: "Other",
};

export default function HODExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semesterFilter, setSemesterFilter] = useState("");
  const [examTypeFilter, setExamTypeFilter] = useState("");

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      let url = "/users/hod/exams/?";
      if (semesterFilter) url += `semester=${semesterFilter}&`;
      if (examTypeFilter) url += `exam_type=${examTypeFilter}&`;
      const res = await API.get(url);
      setExams(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchExams();
  };

  const handleClear = () => {
    setSemesterFilter("");
    setExamTypeFilter("");
    setTimeout(() => fetchExams(), 100);
  };

  const totalStudents = exams.reduce((sum, e) => sum + e.total_students, 0);
  const totalPassed = exams.reduce((sum, e) => sum + e.passed, 0);
  const totalFailed = exams.reduce((sum, e) => sum + e.failed, 0);
  const avgPassPct = exams.length > 0
    ? Math.round(exams.reduce((sum, e) => sum + e.pass_percentage, 0) / exams.length)
    : 0;

  return (
    <HODLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Exam Results</h1>
          <p className="text-gray-500 text-sm mt-1">View all exam results across your year groups</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Exams", value: exams.length, color: "text-amber-600" },
            { label: "Total Appeared", value: totalStudents, color: "text-indigo-600" },
            { label: "Total Passed", value: totalPassed, color: "text-emerald-600" },
            { label: "Avg Pass %", value: `${avgPassPct}%`, color: avgPassPct >= 60 ? "text-emerald-600" : "text-red-500" },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-gray-500 text-xs font-medium">{card.label}</p>
              <p className={`text-3xl font-bold ${card.color} mt-1`}>{card.value}</p>
            </div>
          ))}
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
              value={examTypeFilter}
              onChange={(e) => setExamTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">All Types</option>
              {Object.entries(examTypeLabels).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
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

        {/* Exams Table */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading exams...</div>
        ) : exams.length > 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-5 py-3 text-gray-600 font-semibold">Exam</th>
                    <th className="text-left px-5 py-3 text-gray-600 font-semibold">Type</th>
                    <th className="text-left px-5 py-3 text-gray-600 font-semibold">Subject</th>
                    <th className="text-left px-5 py-3 text-gray-600 font-semibold">Section</th>
                    <th className="text-left px-5 py-3 text-gray-600 font-semibold">Faculty</th>
                    <th className="text-left px-5 py-3 text-gray-600 font-semibold">Date</th>
                    <th className="text-left px-5 py-3 text-gray-600 font-semibold">Max</th>
                    <th className="text-left px-5 py-3 text-gray-600 font-semibold">Appeared</th>
                    <th className="text-left px-5 py-3 text-gray-600 font-semibold">Passed</th>
                    <th className="text-left px-5 py-3 text-gray-600 font-semibold">Avg</th>
                    <th className="text-left px-5 py-3 text-gray-600 font-semibold">Pass %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-800">{exam.title}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs bg-amber-50 text-amber-600 font-medium px-2 py-1 rounded-full">
                          {exam.exam_type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{exam.subject_name} <span className="text-gray-400">({exam.subject_code})</span></td>
                      <td className="px-5 py-3 text-gray-600">Sec {exam.section_name} • Sem {exam.semester}</td>
                      <td className="px-5 py-3 text-gray-600">{exam.conducted_by}</td>
                      <td className="px-5 py-3 text-gray-500">{exam.date}</td>
                      <td className="px-5 py-3 text-gray-600">{exam.max_marks}</td>
                      <td className="px-5 py-3 text-gray-600">{exam.appeared}</td>
                      <td className="px-5 py-3 text-emerald-600 font-semibold">{exam.passed}</td>
                      <td className="px-5 py-3 text-gray-600">{exam.average_marks}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${exam.pass_percentage >= 60 ? "bg-emerald-500" : "bg-red-400"}`}
                              style={{ width: `${exam.pass_percentage}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs font-bold ${exam.pass_percentage >= 60 ? "text-emerald-600" : "text-red-500"}`}>
                            {exam.pass_percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <p className="text-5xl mb-3">📊</p>
            <p className="text-sm">No exam data found</p>
          </div>
        )}

      </div>
    </HODLayout>
  );
}