import { useState, useEffect } from "react";
import FacultyLayout from "../../components/shared/FacultyLayout";
import API from "../../api/axios";
import { BarChart3 } from "../../components/shared/icons";

const examTypeLabels = {
  sessional1: "Sessional 1",
  sessional2: "Sessional 2",
  endsem: "End Semester",
  practical: "Practical",
  assignment: "Assignment",
  other: "Other",
};

export default function FacultyMarks() {
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [marks, setMarks] = useState({});
  const [absent, setAbsent] = useState({});
  const [remarks, setRemarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState("create");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterType, setFilterType] = useState("");

  const [examForm, setExamForm] = useState({
    title: "",
    exam_type: "sessional1",
    subject: "",
    section: "",
    date: new Date().toISOString().split("T")[0],
    max_marks: "",
    passing_marks: "",
  });

  useEffect(() => {
    fetchSubjects();
    fetchSections();
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExam) fetchStudentsForExam(selectedExam.section);
  }, [selectedExam]);

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

  const fetchExams = async () => {
    setLoading(true);
    try {
      let url = "/exams/faculty/?";
      if (filterSubject) url += `subject_id=${filterSubject}&`;
      if (filterType) url += `exam_type=${filterType}&`;
      const res = await API.get(url);
      setExams(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForExam = async (sectionId) => {
    setStudentsLoading(true);
    try {
      const res = await API.get(`/attendance/section-students/?section_id=${sectionId}`);
      setStudents(res.data);

      // Pre-fill marks if results exist
      const marksInit = {};
      const absentInit = {};
      const remarksInit = {};

      if (selectedExam?.results?.length > 0) {
        selectedExam.results.forEach((r) => {
          marksInit[r.student] = r.marks_obtained;
          absentInit[r.student] = r.is_absent;
          remarksInit[r.student] = r.remarks || "";
        });
      } else {
        res.data.forEach((s) => {
          marksInit[s.id] = "";
          absentInit[s.id] = false;
          remarksInit[s.id] = "";
        });
      }

      setMarks(marksInit);
      setAbsent(absentInit);
      setRemarks(remarksInit);
    } catch (err) {
      console.error(err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleExamFormChange = (e) => {
    setExamForm({ ...examForm, [e.target.name]: e.target.value });
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!examForm.title || !examForm.subject || !examForm.section || !examForm.max_marks || !examForm.passing_marks) {
      setErrorMsg("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      await API.post("/exams/create/", {
        ...examForm,
        max_marks: parseFloat(examForm.max_marks),
        passing_marks: parseFloat(examForm.passing_marks),
      });
      setSuccessMsg("Exam created successfully!");
      setExamForm({
        title: "",
        exam_type: "sessional1",
        subject: "",
        section: "",
        date: new Date().toISOString().split("T")[0],
        max_marks: "",
        passing_marks: "",
      });
      fetchExams();
      setActiveTab("results");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to create exam");
    } finally {
      setLoading(false);
    }
  };

  const handleEnterMarks = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const resultsData = students.map((s) => ({
        student_id: s.id,
        marks_obtained: absent[s.id] ? 0 : parseFloat(marks[s.id] || 0),
        is_absent: absent[s.id] || false,
        remarks: remarks[s.id] || "",
      }));

      await API.post(`/exams/${selectedExam.id}/results/`, {
        results: resultsData,
      });

      setSuccessMsg("Marks saved successfully!");
      setSelectedExam(null);
      setStudents([]);
      fetchExams();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to save marks");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;
    try {
      await API.delete(`/exams/${examId}/`);
      setSuccessMsg("Exam deleted successfully!");
      fetchExams();
    } catch (err) {
      setErrorMsg("Failed to delete exam");
    }
  };

  const handleDownloadPDF = async (e) => {
  e.preventDefault();
  setPdfError("");
  setPdfDownloading(true);
  try {
    let url = "/exams/download-pdf/?";
    if (filterSubject) url += `subject_id=${filterSubject}&`;
    if (filterType) url += `exam_type=${filterType}&`;

    const token = localStorage.getItem("access_token");
    const response = await fetch(`http://127.0.0.1:8000/api${url}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const err = await response.json();
      setPdfError(err.error || "No data found");
      return;
    }

    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Marks_Report_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (err) {
    setPdfError("Download failed. Please try again.");
  } finally {
    setPdfDownloading(false);
  }
};

  return (
    <FacultyLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Exam Marks</h1>
          <p className="text-gray-500 text-sm mt-1">Create exams and manage student marks</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 w-fit">
          {["create", "results"].map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedExam(null); setStudents([]); }}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all capitalize ${activeTab === tab ? "bg-emerald-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
            >
              {tab === "create" ? "Create Exam" : "Enter / View Results"}
            </button>
          ))}
        </div>

        {/* Success / Error */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}

        {/* Create Exam Tab */}
        {activeTab === "create" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-2xl">
            <h3 className="font-semibold text-gray-800 mb-5">Create New Exam</h3>
            <form onSubmit={handleCreateExam} className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title *</label>
                <input
                  type="text"
                  name="title"
                  value={examForm.title}
                  onChange={handleExamFormChange}
                  placeholder="e.g. Mid Term Test - Unit 1 & 2"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type *</label>
                  <select
                    name="exam_type"
                    value={examForm.exam_type}
                    onChange={handleExamFormChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {Object.entries(examTypeLabels).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={examForm.date}
                    onChange={handleExamFormChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <select
                    name="subject"
                    value={examForm.subject}
                    onChange={handleExamFormChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                  <select
                    name="section"
                    value={examForm.section}
                    onChange={handleExamFormChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Section</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>Section {s.name} - Sem {s.semester}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Marks *</label>
                  <input
                    type="number"
                    name="max_marks"
                    value={examForm.max_marks}
                    onChange={handleExamFormChange}
                    placeholder="e.g. 30"
                    min="1"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passing Marks *</label>
                  <input
                    type="number"
                    name="passing_marks"
                    value={examForm.passing_marks}
                    onChange={handleExamFormChange}
                    placeholder="e.g. 12"
                    min="1"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Exam"}
              </button>
            </form>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === "results" && (
          <div className="space-y-6">

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex flex-wrap gap-3">
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Types</option>
                  {Object.entries(examTypeLabels).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
                <button
                  onClick={fetchExams}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Filter
                </button>
                {/* Filters */}
<div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
  <div className="flex flex-wrap gap-3 items-end">
    <select
      value={filterSubject}
      onChange={(e) => setFilterSubject(e.target.value)}
      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
    >
      <option value="">All Subjects</option>
      {subjects.map((s) => (
        <option key={s.id} value={s.id}>{s.name}</option>
      ))}
    </select>
    <select
      value={filterType}
      onChange={(e) => setFilterType(e.target.value)}
      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
    >
      <option value="">All Types</option>
      {Object.entries(examTypeLabels).map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
    <button
      onClick={fetchExams}
      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
    >
      Filter
    </button>

    {/* PDF Download Button */}
    <button
      onClick={handleDownloadPDF}
      disabled={pdfDownloading}
      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
    >
      {pdfDownloading ? "Generating..." : "Download PDF Report"}
    </button>
  </div>

  {pdfError && (
    <p className="text-red-500 text-xs mt-2">{pdfError}</p>
  )}
</div>
              </div>
            </div>

            {/* Enter Marks Form */}
            {selectedExam && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-200">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-semibold text-gray-800">{selectedExam.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {selectedExam.subject_name} • Max: {selectedExam.max_marks} • Pass: {selectedExam.passing_marks}
                    </p>
                  </div>
                  <button
                    onClick={() => { setSelectedExam(null); setStudents([]); }}
                    className="text-gray-400 hover:text-gray-600 text-sm"
                  >
                    Cancel
                  </button>
                </div>

                {studentsLoading ? (
                  <div className="text-center py-8 text-gray-400 text-sm">Loading students...</div>
                ) : (
                  <form onSubmit={handleEnterMarks}>
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1 mb-5">
                      {students.map((s) => (
                        <div key={s.id} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${absent[s.id] ? "bg-gray-50 border-gray-200" : "bg-white border-gray-200"}`}>
                          <div className="bg-emerald-100 text-emerald-700 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {s.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">{s.name}</p>
                            <p className="text-xs text-gray-500">{s.enrollment_number}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={absent[s.id] || false}
                                onChange={(e) => setAbsent({ ...absent, [s.id]: e.target.checked })}
                                className="w-4 h-4 accent-red-500"
                              />
                              <span className="text-xs text-red-500 font-medium">Absent</span>
                            </label>
                            <input
                              type="number"
                              value={marks[s.id] || ""}
                              onChange={(e) => setMarks({ ...marks, [s.id]: e.target.value })}
                              disabled={absent[s.id]}
                              min="0"
                              max={selectedExam.max_marks}
                              placeholder="Marks"
                              className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100 disabled:text-gray-400"
                            />
                            <input
                              type="text"
                              value={remarks[s.id] || ""}
                              onChange={(e) => setRemarks({ ...remarks, [s.id]: e.target.value })}
                              placeholder="Remarks"
                              className="w-28 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
                    >
                      {loading ? "Saving..." : "Save All Marks"}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Exams List */}
            {loading ? (
              <div className="text-center py-16 text-gray-400 text-sm">Loading exams...</div>
            ) : exams.length > 0 ? (
              <div className="space-y-4">
                {exams.map((exam) => (
                  <div key={exam.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-800">{exam.title}</h4>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                            {examTypeLabels[exam.exam_type]}
                          </span>
                          <span className="text-xs text-gray-500">{exam.subject_name}</span>
                          <span className="text-xs text-gray-500">Section {exam.section_name}</span>
                          <span className="text-xs text-gray-500">{exam.date}</span>
                          <span className="text-xs text-gray-500">Max: {exam.max_marks} | Pass: {exam.passing_marks}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right mr-2">
                          <p className="text-xs text-gray-500">{exam.total_students} students</p>
                          <p className="text-xs text-gray-500">Avg: {exam.average_marks}%</p>
                        </div>
                        <button
                          onClick={() => { setSelectedExam(exam); setActiveTab("results"); }}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                        >
                          Enter Marks
                        </button>
                        <button
                          onClick={() => handleDeleteExam(exam.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Results Preview */}
                    {exam.results?.length > 0 && (
                      <div className="overflow-x-auto">
  <table className="w-full text-sm min-w-[600px]">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="text-left px-6 py-2.5 text-gray-600 font-semibold text-xs">Student</th>
                              <th className="text-left px-6 py-2.5 text-gray-600 font-semibold text-xs">Enrollment</th>
                              <th className="text-left px-6 py-2.5 text-gray-600 font-semibold text-xs">Marks</th>
                              <th className="text-left px-6 py-2.5 text-gray-600 font-semibold text-xs">Status</th>
                              <th className="text-left px-6 py-2.5 text-gray-600 font-semibold text-xs">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {exam.results.map((r) => (
                              <tr key={r.id} className="hover:bg-gray-50">
                                <td className="px-6 py-2.5 text-gray-800 text-xs font-medium">{r.student_name}</td>
                                <td className="px-6 py-2.5 text-gray-500 text-xs">{r.student_enrollment}</td>
                                <td className="px-6 py-2.5 text-gray-800 text-xs font-semibold">
                                  {r.is_absent ? "—" : `${r.marks_obtained} / ${exam.max_marks}`}
                                </td>
                                <td className="px-6 py-2.5 text-xs">
                                  {r.is_absent ? (
                                    <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Absent</span>
                                  ) : r.is_passed ? (
                                    <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full">Passed</span>
                                  ) : (
                                    <span className="bg-red-50 text-red-500 px-2 py-0.5 rounded-full">Failed</span>
                                  )}
                                </td>
                                <td className="px-6 py-2.5 text-gray-500 text-xs">{r.remarks || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <BarChart3 className="w-14 h-14 mx-auto mb-3 opacity-50" strokeWidth={1.5} />
                <p className="text-sm">No exams created yet</p>
              </div>
            )}
          </div>
        )}

      </div>
    </FacultyLayout>
  );
}