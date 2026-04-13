import { useState, useEffect } from "react";
import StudentLayout from "../../components/shared/StudentLayout";
import API from "../../api/axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ClipboardList } from "../../components/shared/icons";

export default function StudentAttendance() {
  const [summary, setSummary] = useState([]);
  const [detail, setDetail] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchSummary();
    fetchSubjects();
    fetchDetail();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await API.get("/attendance/my-summary/");
      setSummary(res.data);
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

  const fetchDetail = async () => {
    setDetailLoading(true);
    try {
      let url = "/attendance/my-detail/?";
      if (selectedSubject) url += `subject_id=${selectedSubject}&`;
      if (dateFrom) url += `date_from=${dateFrom}&`;
      if (dateTo) url += `date_to=${dateTo}&`;
      const res = await API.get(url);
      setDetail(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchDetail();
  };

  const handleClear = () => {
    setSelectedSubject("");
    setDateFrom("");
    setDateTo("");
    setTimeout(() => fetchDetail(), 100);
  };

  return (
    <StudentLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>
          <p className="text-gray-500 text-sm mt-1">Track your subject-wise attendance</p>
        </div>
        {/* Low Attendance Warning */}
{summary.filter(s => s.attendance_percentage < 75).length > 0 && (
  <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
    <div className="flex items-start gap-3">
      <div className="text-2xl flex-shrink-0">⚠️</div>
      <div className="flex-1">
        <h3 className="font-semibold text-red-700">Low Attendance Warning</h3>
        <p className="text-red-600 text-xs mt-1 mb-4">
          You need at least 75% attendance in all subjects to be eligible for exams.
        </p>
        <div className="space-y-3">
          {summary
            .filter(s => s.attendance_percentage < 75)
            .map(s => {
              const totalClasses = s.total_classes;
              const currentPresent = s.total_present;
              const requiredPresent = Math.ceil(0.75 * totalClasses);
              const classesNeeded = Math.max(0, requiredPresent - currentPresent);
              const futureclassesNeeded = classesNeeded > 0
                ? Math.ceil(classesNeeded / 0.75)
                : 0;

              return (
                <div key={s.subject_id} className="bg-white rounded-xl p-3 border border-red-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-800">{s.subject_name}</span>
                    <span className="text-sm font-bold text-red-500">{s.attendance_percentage}%</span>
                  </div>
                  <div className="h-2 bg-red-100 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-red-400 rounded-full"
                      style={{ width: `${s.attendance_percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {currentPresent} present out of {totalClasses} classes
                    </span>
                    {futureclassesNeeded > 0 && (
                      <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        Attend next {futureclassesNeeded} classes consecutively to recover
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>
    </div>
  </div>
)}

        {/* Summary Cards */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summary.map((s) => (
              <div key={s.subject_id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 font-medium truncate">{s.subject_name}</p>
                <p className={`text-2xl font-bold text-white mt-1 ${s.attendance_percentage >= 75 ? "text-green-600" : "text-red-500"}`}>
                  {s.attendance_percentage}%
                </p>
                <p className="text-xs text-gray-400 mt-1">{s.total_present}/{s.total_classes} classes</p>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.attendance_percentage >= 75 ? "bg-green-500" : "bg-red-400"}`}
                    style={{ width: `${s.attendance_percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bar Chart */}
        {summary.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-gray-800 font-semibold mb-4">Subject-wise Attendance Overview</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={summary} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="subject_code" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${value}%`, "Attendance"]} />
                <Bar dataKey="attendance_percentage" radius={[6, 6, 0, 0]}>
                  {summary.map((entry, index) => (
                    <Cell key={index} fill={entry.attendance_percentage >= 75 ? "#6366f1" : "#f87171"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span className="text-xs text-gray-500">Above 75% (Safe)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <span className="text-xs text-gray-500">Below 75% (At Risk)</span>
              </div>
            </div>
          </div>
        )}

        {/* Filter Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-gray-800 font-semibold mb-4">Attendance History</h3>

          <form onSubmit={handleFilter} className="flex flex-wrap gap-3 mb-6">
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

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              Apply Filter
            </button>

            <button type="button" onClick={handleClear}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              Clear
            </button>
          </form>

          {/* Detail Table */}
          {detailLoading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
          ) : detail.length > 0 ? (
            <div className="overflow-x-auto">
  <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 rounded-xl">
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold rounded-l-xl">Date</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold">Subject</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold">Time</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold">Topic Covered</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-semibold rounded-r-xl">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {detail.map((d, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-700">{d.date}</td>
                      <td className="px-4 py-3 text-gray-700">{d.subject} <span className="text-gray-400 text-xs">({d.subject_code})</span></td>
                      <td className="px-4 py-3 text-gray-500">{d.start_time}</td>
                      <td className="px-4 py-3 text-gray-500">{d.topic_covered || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${d.status === "present" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                          {d.status === "present" ? "✓ Present" : "✗ Absent"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" strokeWidth={1.5} />
              <p className="text-sm">No attendance records found</p>
            </div>
          )}
        </div>

      </div>
    </StudentLayout>
  );
}