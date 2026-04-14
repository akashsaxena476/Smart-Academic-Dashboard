import { useState, useEffect } from "react";
import HODLayout from "../../components/shared/HODLayout";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

export default function HODNotices() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedNotice, setExpandedNotice] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    recipient_type: "all_faculty",
    specific_recipients: [],
    target_year: "",
    target_semester: "",
    target_section: "",
  });

  const yearGroups = [];
  if (user?.faculty_profile?.hod_year_1) yearGroups.push({ value: "1", label: "1st Year (Sem 1-2)" });
  if (user?.faculty_profile?.hod_year_2) yearGroups.push({ value: "2", label: "2nd Year (Sem 3-4)" });
  if (user?.faculty_profile?.hod_year_3) yearGroups.push({ value: "3", label: "3rd Year (Sem 5-6)" });
  if (user?.faculty_profile?.hod_year_4) yearGroups.push({ value: "4", label: "4th Year (Sem 7-8)" });

  const semesterMap = { "1": [1,2], "2": [3,4], "3": [5,6], "4": [7,8] };

  useEffect(() => {
    fetchNotices();
    fetchFaculty();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await API.get("/notices/hod/");
      setNotices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      const res = await API.get("/users/hod/faculty/");
      setFaculty(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");
    if (!formData.title || !formData.content) {
      setErrorMsg("Title and content are required"); return;
    }
    if (formData.recipient_type === "specific_faculty" && formData.specific_recipients.length === 0) {
      setErrorMsg("Please select at least one faculty member"); return;
    }
    setSending(true);
    try {
      await API.post("/notices/create/", formData);
      setSuccessMsg("Notice sent successfully!");
      setFormData({
        title: "", content: "", recipient_type: "all_faculty",
        specific_recipients: [], target_year: "", target_semester: "", target_section: "",
      });
      fetchNotices();
      setActiveTab("sent");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to send notice");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (noticeId) => {
    if (!window.confirm("Are you sure you want to delete this notice?")) return;
    try {
      await API.delete(`/notices/${noticeId}/delete/`);
      setSuccessMsg("Notice deleted!");
      fetchNotices();
    } catch (err) {
      setErrorMsg("Failed to delete notice");
    }
  };

  const toggleRecipient = (facultyId) => {
    setFormData(prev => ({
      ...prev,
      specific_recipients: prev.specific_recipients.includes(facultyId)
        ? prev.specific_recipients.filter(id => id !== facultyId)
        : [...prev.specific_recipients, facultyId]
    }));
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  const getRecipientLabel = (notice) => {
    switch (notice.recipient_type) {
      case "all_faculty": return { text: "All Faculty", bg: "bg-indigo-50", color: "text-indigo-600" };
      case "specific_faculty": return { text: "Specific Faculty", bg: "bg-purple-50", color: "text-purple-600" };
      case "all_students": return { text: "All Students", bg: "bg-emerald-50", color: "text-emerald-600" };
      case "specific_students": {
        let label = "Students";
        if (notice.target_year) label += ` • Year ${notice.target_year}`;
        if (notice.target_semester) label += ` • Sem ${notice.target_semester}`;
        if (notice.target_section) label += ` • Sec ${notice.target_section}`;
        return { text: label, bg: "bg-amber-50", color: "text-amber-600" };
      }
      default: return { text: notice.recipient_type, bg: "bg-gray-50", color: "text-gray-600" };
    }
  };

  const isFacultyType = formData.recipient_type === "all_faculty" || formData.recipient_type === "specific_faculty";
  const isStudentType = formData.recipient_type === "all_students" || formData.recipient_type === "specific_students";

  return (
    <HODLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notice Board</h1>
          <p className="text-gray-500 text-sm mt-1">Send notices to faculty or students</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 w-fit">
          <button onClick={() => setActiveTab("create")}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "create" ? "bg-amber-600 text-white" : "text-gray-500 hover:text-gray-700"}`}>
            Create Notice
          </button>
          <button onClick={() => { setActiveTab("sent"); fetchNotices(); }}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "sent" ? "bg-amber-600 text-white" : "text-gray-500 hover:text-gray-700"}`}>
            Sent Notices ({notices.length})
          </button>
        </div>

        {successMsg && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">{successMsg}</div>}
        {errorMsg && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{errorMsg}</div>}

        {/* Create Notice Tab */}
        {activeTab === "create" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-2xl">
            <h3 className="font-semibold text-gray-800 mb-5">Compose New Notice</h3>
            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notice Title *</label>
                <input type="text" value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Important: Attendance Submission Deadline"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your notice here..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
              </div>

              {/* Recipient Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Send To *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "all_faculty", label: "All Faculty", icon: "👨‍🏫", desc: "All faculty in your dept" },
                    { value: "specific_faculty", label: "Specific Faculty", icon: "👤", desc: "Choose specific faculty" },
                    { value: "all_students", label: "All Students", icon: "👥", desc: "All students in your years" },
                    { value: "specific_students", label: "Specific Students", icon: "🎯", desc: "Filter by year/sem/section" },
                  ].map((opt) => (
                    <button key={opt.value} type="button"
                      onClick={() => setFormData({ ...formData, recipient_type: opt.value, specific_recipients: [], target_year: "", target_semester: "", target_section: "" })}
                      className={`p-3 rounded-xl border text-left transition-all ${formData.recipient_type === opt.value ? "bg-amber-600 border-amber-600 text-white" : "bg-white border-gray-200 text-gray-600 hover:border-amber-400"}`}>
                      <p className="text-base">{opt.icon}</p>
                      <p className={`text-xs font-semibold mt-1 ${formData.recipient_type === opt.value ? "text-white" : "text-gray-800"}`}>{opt.label}</p>
                      <p className={`text-xs mt-0.5 ${formData.recipient_type === opt.value ? "text-amber-100" : "text-gray-400"}`}>{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Specific Faculty Selection */}
              {formData.recipient_type === "specific_faculty" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Faculty
                    <span className="text-amber-600 ml-1">({formData.specific_recipients.length} selected)</span>
                  </label>
                  <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    {faculty.map((f) => (
                      <div key={f.id} onClick={() => toggleRecipient(f.id)}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-50 last:border-0 ${formData.specific_recipients.includes(f.id) ? "bg-amber-50" : "hover:bg-gray-50"}`}>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${formData.specific_recipients.includes(f.id) ? "bg-amber-600 border-amber-600" : "border-gray-300"}`}>
                          {formData.specific_recipients.includes(f.id) && <span className="text-white text-xs font-bold">✓</span>}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{f.name}</p>
                          <p className="text-xs text-gray-500">{f.designation} • {f.employee_id}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Specific Students Filter */}
              {formData.recipient_type === "specific_students" && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Filter Students</label>
                  <p className="text-xs text-gray-400">Leave empty to include all. Filters combine together.</p>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Year Group</label>
                    <select value={formData.target_year}
                      onChange={(e) => setFormData({ ...formData, target_year: e.target.value, target_semester: "" })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                      <option value="">All Year Groups</option>
                      {yearGroups.map(y => (
                        <option key={y.value} value={y.value}>{y.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Semester</label>
                    <select value={formData.target_semester}
                      onChange={(e) => setFormData({ ...formData, target_semester: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                      <option value="">All Semesters</option>
                      {(formData.target_year ? semesterMap[formData.target_year] : [1,2,3,4,5,6,7,8]).map(s => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Section</label>
                    <select value={formData.target_section}
                      onChange={(e) => setFormData({ ...formData, target_section: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                      <option value="">All Sections</option>
                      {["A","B","C","D"].map(s => (
                        <option key={s} value={s}>Section {s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Preview */}
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Notice will be sent to:</p>
                    <p className="text-xs text-amber-600">
                      Students
                      {formData.target_year ? ` of Year ${formData.target_year}` : " of all your year groups"}
                      {formData.target_semester ? `, Semester ${formData.target_semester}` : ""}
                      {formData.target_section ? `, Section ${formData.target_section}` : ""}
                    </p>
                  </div>
                </div>
              )}

              <button type="submit" disabled={sending}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50">
                {sending ? "Sending..." : "Send Notice"}
              </button>
            </form>
          </div>
        )}

        {/* Sent Notices Tab */}
        {activeTab === "sent" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
            ) : notices.length > 0 ? (
              notices.map((notice) => {
                const recipientInfo = getRecipientLabel(notice);
                return (
                  <div key={notice.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 flex items-start justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedNotice(expandedNotice === notice.id ? null : notice.id)}>
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="bg-amber-100 text-amber-600 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">
                          📢
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800">{notice.title}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${recipientInfo.bg} ${recipientInfo.color}`}>
                              {recipientInfo.text}
                            </span>
                            <span className="text-xs text-gray-400">{formatDate(notice.created_at)}</span>
                            <span className="text-xs text-gray-400">{notice.read_count} read</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(notice.id); }}
                          className="bg-red-50 hover:bg-red-100 text-red-500 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                          Delete
                        </button>
                        <span className="text-gray-400">{expandedNotice === notice.id ? "▲" : "▼"}</span>
                      </div>
                    </div>
                    {expandedNotice === notice.id && (
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{notice.content}</p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
                <p className="text-5xl mb-3">📢</p>
                <p className="text-sm">No notices sent yet</p>
              </div>
            )}
          </div>
        )}

      </div>
    </HODLayout>
  );
}