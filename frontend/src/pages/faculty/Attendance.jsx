import { useState, useEffect } from "react";
import FacultyLayout from "../../components/shared/FacultyLayout";
import API from "../../api/axios";
import { Users, ClipboardList } from "../../components/shared/icons";

export default function FacultyAttendance() {
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState("mark");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const [formData, setFormData] = useState({
    subject: "",
    section: "",
    date: new Date().toISOString().split("T")[0],
    start_time: "",
    topic_covered: "",
  });

  const [attendance, setAttendance] = useState({});

  const [downloadFilters, setDownloadFilters] = useState({
    subject_id: "",
    section_id: "",
    date_from: "",
    date_to: "",
  });

  useEffect(() => {
    fetchSubjects();
    fetchSections();
    fetchSessions();
  }, []);

  useEffect(() => {
    if (formData.section) fetchStudents(formData.section);
  }, [formData.section]);

  const fetchSubjects = async () => {
    try {
      const res = await API.get("/academics/subjects/");
      setSubjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSections = async () => {
    try {
      const res = await API.get("/academics/sections/");
      setSections(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async (sectionId) => {
    setStudentsLoading(true);
    try {
      const res = await API.get(`/attendance/section-students/?section_id=${sectionId}`);
      setStudents(res.data);
      const initial = {};
      res.data.forEach((s) => { initial[s.id] = "present"; });
      setAttendance(initial);
    } catch (err) {
      console.error(err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await API.get("/attendance/faculty-sessions/");
      setSessions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleAttendance = (studentId) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  };

  const markAllPresent = () => {
    const all = {};
    students.forEach((s) => { all[s.id] = "present"; });
    setAttendance(all);
  };

  const markAllAbsent = () => {
    const all = {};
    students.forEach((s) => { all[s.id] = "absent"; });
    setAttendance(all);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.subject || !formData.section || !formData.date || !formData.start_time) {
      setErrorMsg("Please fill all required fields");
      return;
    }

    if (students.length === 0) {
      setErrorMsg("No students found in this section");
      return;
    }

    setLoading(true);
    try {
      const attendanceData = students.map((s) => ({
        student_id: s.id,
        status: attendance[s.id] || "absent",
      }));

      await API.post("/attendance/create-session/", {
        ...formData,
        attendance: attendanceData,
      });

      setSuccessMsg("Attendance marked successfully!");
      setFormData({
        subject: "",
        section: "",
        date: new Date().toISOString().split("T")[0],
        start_time: "",
        topic_covered: "",
      });
      setStudents([]);
      setAttendance({});
      fetchSessions();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to mark attendance");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async (e) => {
    e.preventDefault();
    setDownloadError("");
    setDownloading(true);
    try {
      let url = "/attendance/download-excel/?";
      if (downloadFilters.subject_id) url += `subject_id=${downloadFilters.subject_id}&`;
      if (downloadFilters.section_id) url += `section_id=${downloadFilters.section_id}&`;
      if (downloadFilters.date_from) url += `date_from=${downloadFilters.date_from}&`;
      if (downloadFilters.date_to) url += `date_to=${downloadFilters.date_to}&`;

      const token = localStorage.getItem("access_token");
      const response = await fetch(`http://127.0.0.1:8000/api${url}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json();
        setDownloadError(err.error || "No data found for selected filters");
        return;
      }

      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      const disposition = response.headers.get("Content-Disposition");
      const filename = disposition
        ? disposition.split('filename=')[1].replace(/"/g, '')
        : "attendance.xlsx";
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      setDownloadError("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const presentCount = Object.values(attendance).filter((s) => s === "present").length;
  const absentCount = Object.values(attendance).filter((s) => s === "absent").length;

  return (
    <FacultyLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>
          <p className="text-gray-500 text-sm mt-1">Mark and manage student attendance</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 w-fit">
          <button
            onClick={() => setActiveTab("mark")}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "mark" ? "bg-emerald-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
          >
            Mark Attendance
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "history" ? "bg-emerald-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
          >
            Session History
          </button>
          <button
            onClick={() => setActiveTab("download")}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "download" ? "bg-emerald-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
          >
            Download Report
          </button>
        </div>

        {/* Mark Attendance Tab */}
        {activeTab === "mark" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Session Details</h3>

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4 text-sm">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <select name="subject" value={formData.subject} onChange={handleFormChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                  <select name="section" value={formData.section} onChange={handleFormChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Select Section</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>Section {s.name} - Sem {s.semester}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" name="date" value={formData.date} onChange={handleFormChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <input type="time" name="start_time" value={formData.start_time} onChange={handleFormChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topic Covered</label>
                  <input type="text" name="topic_covered" value={formData.topic_covered} onChange={handleFormChange}
                    placeholder="e.g. Introduction to Arrays"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50">
                  {loading ? "Submitting..." : "Submit Attendance"}
                </button>
              </form>
            </div>

            {/* Students List */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">
                  Students
                  {students.length > 0 && (
                    <span className="ml-2 text-sm text-gray-400">({students.length} total)</span>
                  )}
                </h3>
                {students.length > 0 && (
                  <div className="flex gap-2">
                    <button onClick={markAllPresent}
                      className="text-xs bg-green-50 hover:bg-green-100 text-green-600 px-3 py-1.5 rounded-lg font-medium transition-colors">
                      All Present
                    </button>
                    <button onClick={markAllAbsent}
                      className="text-xs bg-red-50 hover:bg-red-100 text-red-500 px-3 py-1.5 rounded-lg font-medium transition-colors">
                      All Absent
                    </button>
                  </div>
                )}
              </div>

              {students.length > 0 && (
                <div className="flex gap-4 mb-4">
                  <div className="bg-green-50 rounded-xl px-4 py-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-sm font-semibold text-green-600">Present: {presentCount}</span>
                  </div>
                  <div className="bg-red-50 rounded-xl px-4 py-2 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <span className="text-sm font-semibold text-red-500">Absent: {absentCount}</span>
                  </div>
                </div>
              )}

              {studentsLoading ? (
                <div className="text-center py-12 text-gray-400 text-sm">Loading students...</div>
              ) : students.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {students.map((student) => (
                    <div key={student.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer
                        ${attendance[student.id] === "present"
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                        }`}
                      onClick={() => toggleAttendance(student.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
                          ${attendance[student.id] === "present" ? "bg-green-500 text-white" : "bg-red-400 text-white"}`}>
                          {student.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.enrollment_number}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full
                        ${attendance[student.id] === "present"
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-500"
                        }`}>
                        {attendance[student.id] === "present" ? "Present" : "Absent"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" strokeWidth={1.5} />
                  <p className="text-sm">Select a section to load students</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Session History Tab */}
        {activeTab === "history" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Past Sessions</h3>
            </div>
            {sessions.length > 0 ? (
              <div className="overflow-x-auto">
  <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-6 py-3 text-gray-600 font-semibold">Subject</th>
                      <th className="text-left px-6 py-3 text-gray-600 font-semibold">Section</th>
                      <th className="text-left px-6 py-3 text-gray-600 font-semibold">Date</th>
                      <th className="text-left px-6 py-3 text-gray-600 font-semibold">Time</th>
                      <th className="text-left px-6 py-3 text-gray-600 font-semibold">Topic</th>
                      <th className="text-left px-6 py-3 text-gray-600 font-semibold">Present</th>
                      <th className="text-left px-6 py-3 text-gray-600 font-semibold">Absent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sessions.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-800">{s.subject_name}</td>
                        <td className="px-6 py-4 text-gray-600">Section {s.section_name}</td>
                        <td className="px-6 py-4 text-gray-500">{s.date}</td>
                        <td className="px-6 py-4 text-gray-500">{s.start_time}</td>
                        <td className="px-6 py-4 text-gray-500">{s.topic_covered || "—"}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold bg-green-50 text-green-600 px-2 py-1 rounded-full">
                            {s.total_present} Present
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold bg-red-50 text-red-500 px-2 py-1 rounded-full">
                            {s.total_absent} Absent
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" strokeWidth={1.5} />
                <p className="text-sm">No sessions recorded yet</p>
              </div>
            )}
          </div>
        )}

        {/* Download Tab */}
        {activeTab === "download" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-emerald-100 text-emerald-600 w-12 h-12 rounded-xl flex items-center justify-center text-2xl">
                📥
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Download Attendance Report</h3>
                <p className="text-sm text-gray-500 mt-0.5">Export attendance data as a formatted Excel file</p>
              </div>
            </div>

            {downloadError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                {downloadError}
              </div>
            )}

            <form onSubmit={handleDownloadExcel} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select
                    value={downloadFilters.subject_id}
                    onChange={(e) => setDownloadFilters({ ...downloadFilters, subject_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">All Subjects</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <select
                    value={downloadFilters.section_id}
                    onChange={(e) => setDownloadFilters({ ...downloadFilters, section_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">All Sections</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>Section {s.name} - Sem {s.semester}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={downloadFilters.date_from}
                    onChange={(e) => setDownloadFilters({ ...downloadFilters, date_from: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={downloadFilters.date_to}
                    onChange={(e) => setDownloadFilters({ ...downloadFilters, date_to: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                <p className="text-sm font-semibold text-emerald-700 mb-2">What will be included:</p>
                <ul className="text-xs text-emerald-600 space-y-1">
                  <li>✅ Student enrollment number, name, branch, semester, section</li>
                  <li>✅ Date wise attendance (P = Present, A = Absent)</li>
                  <li>✅ Total present and absent count per student</li>
                  <li>✅ Attendance percentage with color coding</li>
                  <li>✅ Students below 75% highlighted in red</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={downloading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {downloading ? "Generating Excel..." : "Download Attendance Excel"}
              </button>
            </form>
          </div>
        )}

      </div>
    </FacultyLayout>
  );
}