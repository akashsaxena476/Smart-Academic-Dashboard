import { useState, useEffect } from "react";
import HODLayout from "../../components/shared/HODLayout";
import API from "../../api/axios";

export default function HODNotices() {
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
    recipient_type: "all",
    specific_recipients: [],
  });

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
      setErrorMsg("Title and content are required");
      return;
    }
    if (formData.recipient_type === "specific" && formData.specific_recipients.length === 0) {
      setErrorMsg("Please select at least one faculty member");
      return;
    }
    setSending(true);
    try {
      await API.post("/notices/create/", formData);
      setSuccessMsg("Notice sent successfully!");
      setFormData({ title: "", content: "", recipient_type: "all", specific_recipients: [] });
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
      setSuccessMsg("Notice deleted successfully!");
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

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <HODLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notice Board</h1>
          <p className="text-gray-500 text-sm mt-1">Send notices to faculty members</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 w-fit">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "create" ? "bg-amber-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
          >
            Create Notice
          </button>
          <button
            onClick={() => { setActiveTab("sent"); fetchNotices(); }}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "sent" ? "bg-amber-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
          >
            Sent Notices ({notices.length})
          </button>
        </div>

        {/* Messages */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">{successMsg}</div>
        )}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{errorMsg}</div>
        )}

        {/* Create Notice Tab */}
        {activeTab === "create" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-2xl">
            <h3 className="font-semibold text-gray-800 mb-5">Compose New Notice</h3>
            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notice Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Important: Attendance Submission Deadline"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your notice here..."
                  rows={5}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Send To *</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, recipient_type: "all", specific_recipients: [] })}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${formData.recipient_type === "all" ? "bg-amber-600 text-white border-amber-600" : "bg-white text-gray-600 border-gray-300 hover:border-amber-400"}`}
                  >
                    All Faculty
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, recipient_type: "specific" })}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${formData.recipient_type === "specific" ? "bg-amber-600 text-white border-amber-600" : "bg-white text-gray-600 border-gray-300 hover:border-amber-400"}`}
                  >
                    Specific Faculty
                  </button>
                </div>
              </div>

              {/* Specific Faculty Selection */}
              {formData.recipient_type === "specific" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Faculty Members
                    <span className="text-amber-600 ml-1">({formData.specific_recipients.length} selected)</span>
                  </label>
                  <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    {faculty.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => toggleRecipient(f.id)}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-50 last:border-0
                          ${formData.specific_recipients.includes(f.id) ? "bg-amber-50" : "hover:bg-gray-50"}`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
                          ${formData.specific_recipients.includes(f.id) ? "bg-amber-600 border-amber-600" : "border-gray-300"}`}>
                          {formData.specific_recipients.includes(f.id) && (
                            <span className="text-white text-xs font-bold">✓</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{f.name}</p>
                          <p className="text-xs text-gray-500">{f.designation} • {f.employee_id}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send Notice"}
              </button>
            </form>
          </div>
        )}

        {/* Sent Notices Tab */}
        {activeTab === "sent" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-16 text-gray-400 text-sm">Loading notices...</div>
            ) : notices.length > 0 ? (
              notices.map((notice) => (
                <div key={notice.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                  {/* Notice Header */}
                  <div
                    className="px-6 py-4 flex items-start justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedNotice(expandedNotice === notice.id ? null : notice.id)}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="bg-amber-100 text-amber-600 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">
                        📢
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800">{notice.title}</h3>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${notice.recipient_type === "all" ? "bg-indigo-50 text-indigo-600" : "bg-purple-50 text-purple-600"}`}>
                            {notice.recipient_type === "all" ? "All Faculty" : "Specific Faculty"}
                          </span>
                          <span className="text-xs text-gray-400">{formatDate(notice.created_at)}</span>
                          <span className="text-xs text-gray-400">{notice.read_count} read</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(notice.id); }}
                        className="bg-red-50 hover:bg-red-100 text-red-500 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                      <span className="text-gray-400">{expandedNotice === notice.id ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedNotice === notice.id && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{notice.content}</p>
                    </div>
                  )}
                </div>
              ))
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