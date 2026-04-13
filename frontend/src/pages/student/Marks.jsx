import { useState, useEffect } from "react";
import StudentLayout from "../../components/shared/StudentLayout";
import API from "../../api/axios";
import { BarChart3 } from "../../components/shared/icons";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";

const examTypeColors = {
  sessional1: { bg: "bg-blue-50", text: "text-blue-600" },
  sessional2: { bg: "bg-purple-50", text: "text-purple-600" },
  endsem: { bg: "bg-indigo-50", text: "text-indigo-600" },
  practical: { bg: "bg-green-50", text: "text-green-600" },
  assignment: { bg: "bg-orange-50", text: "text-orange-600" },
  other: { bg: "bg-gray-50", text: "text-gray-600" },
};

const examTypeLabels = {
  sessional1: "Sessional 1",
  sessional2: "Sessional 2",
  endsem: "End Semester",
  practical: "Practical",
  assignment: "Assignment",
  other: "Other",
};

export default function StudentMarks() {
  const [results, setResults] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedExamType, setSelectedExamType] = useState("");

  useEffect(() => {
    fetchResults();
    fetchSubjects();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    try {
      let url = "/exams/my-results/?";
      if (selectedSubject) url += `subject_id=${selectedSubject}&`;
      if (selectedExamType) url += `exam_type=${selectedExamType}&`;
      const res = await API.get(url);
      setResults(res.data);
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
    fetchResults();
  };

  const handleClear = () => {
    setSelectedSubject("");
    setSelectedExamType("");
    setTimeout(() => fetchResults(), 100);
  };

  // Stats
  const totalExams = results.length;
  const appeared = results.filter((r) => !r.is_absent).length;
  const passed = results.filter((r) => !r.is_absent && r.is_passed).length;
  const avgPercentage = appeared > 0
    ? Math.round(results.filter((r) => !r.is_absent).reduce((sum, r) => sum + r.percentage, 0) / appeared)
    : 0;

  // Chart data
  const chartData = results
    .filter((r) => !r.is_absent)
    .map((r) => ({
      name: `${r.subject_code} - ${examTypeLabels[r.exam_type] || r.exam_type}`,
      percentage: r.percentage,
      marks: `${r.marks_obtained}/${r.max_marks}`,
    }));

  // Group by subject
  const grouped = results.reduce((acc, r) => {
    const key = r.subject_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <StudentLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Exam Marks</h1>
          <p className="text-gray-500 text-sm mt-1">View your exam results and performance</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs font-medium">Total Exams</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{totalExams}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs font-medium">Appeared</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">{appeared}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs font-medium">Passed</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{passed}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs font-medium">Avg Score</p>
            <p className={`text-3xl font-bold mt-1 ${avgPercentage >= 40 ? "text-green-600" : "text-red-500"}`}>
              {avgPercentage}%
            </p>
          </div>
        </div>

        {/* Performance Chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-gray-800 font-semibold mb-4">Performance Overview</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value}% (${props.payload.marks})`,
                    "Score"
                  ]}
                />
                <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.percentage >= 40 ? "#6366f1" : "#f87171"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span className="text-xs text-gray-500">Passed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <span className="text-xs text-gray-500">Failed</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <form onSubmit={handleFilter} className="flex flex-wrap gap-3">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Exam Types</option>
              <option value="sessional1">Sessional 1</option>
              <option value="sessional2">Sessional 2</option>
              <option value="endsem">End Semester</option>
              <option value="practical">Practical</option>
              <option value="assignment">Assignment</option>
              <option value="other">Other</option>
            </select>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Apply Filter
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Clear
            </button>
          </form>
        </div>

        {/* Results Grouped by Subject */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading results...</div>
        ) : Object.keys(grouped).length > 0 ? (
          Object.entries(grouped).map(([subjectName, subjectResults]) => (
            <div key={subjectName} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

              {/* Subject Header */}
              <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">
                    {subjectName[0]}
                  </div>
                  <h3 className="font-semibold text-gray-800">{subjectName}</h3>
                </div>
                <span className="text-xs text-indigo-600 font-medium bg-indigo-100 px-3 py-1 rounded-full">
                  {subjectResults.length} exam{subjectResults.length > 1 ? "s" : ""}
                </span>
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto">
  <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-6 py-3 text-gray-600 font-semibold">Exam</th>
                      <th className="text-left px-6 py-3 text-gray-600 font-semibold">Type</th>
                      <th className="text-left px-6 py-3 text-gray-600 font-semibold">Date</th>
                      <th className="text-left px-6 py-3 text-gray-600 font-semibold">Marks</th>
                      <th className="text-left px-6 py-3 text-gray-600 font-semibold">Percentage</th>
                      <th className="text-left px-6 py-3 text-gray-600 font-semibold">Status</th>
                      <th className="text-left px-6 py-3 text-gray-600 font-semibold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {subjectResults.map((r, i) => {
                      const typeStyle = examTypeColors[r.exam_type] || examTypeColors.other;
                      return (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-800">{r.exam_title}</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
                              {examTypeLabels[r.exam_type] || r.exam_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-500">{r.date}</td>
                          <td className="px-6 py-4 font-semibold text-gray-800">
                            {r.is_absent ? "—" : `${r.marks_obtained} / ${r.max_marks}`}
                          </td>
                          <td className="px-6 py-4">
                            {r.is_absent ? "—" : (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-100 rounded-full w-20">
                                  <div
                                    className={`h-full rounded-full ${r.percentage >= 40 ? "bg-indigo-500" : "bg-red-400"}`}
                                    style={{ width: `${r.percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-medium text-gray-600">{r.percentage}%</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {r.is_absent ? (
                              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-500">Absent</span>
                            ) : r.is_passed ? (
                              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-50 text-green-600">Passed</span>
                            ) : (
                              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-red-50 text-red-500">Failed</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs">{r.remarks || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 text-gray-400">
            <BarChart3 className="w-14 h-14 mx-auto mb-3 opacity-50" strokeWidth={1.5} />
            <p className="text-sm">No exam results found</p>
          </div>
        )}

      </div>
    </StudentLayout>
  );
}