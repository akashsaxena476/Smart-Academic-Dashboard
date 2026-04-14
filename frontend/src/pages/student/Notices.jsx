import { useState, useEffect } from "react";
import StudentLayout from "../../components/shared/StudentLayout";
import API from "../../api/axios";

export default function StudentNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedNotice, setExpandedNotice] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await API.get("/notices/student/");
      setNotices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (noticeId) => {
    try {
      await API.put(`/notices/${noticeId}/read/`);
      setNotices(prev => prev.map(n => n.id === noticeId ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleExpand = (noticeId, isRead) => {
    setExpandedNotice(expandedNotice === noticeId ? null : noticeId);
    if (!isRead) handleMarkRead(noticeId);
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  const filteredNotices = notices.filter(n => {
    if (filter === "unread") return !n.is_read;
    if (filter === "read") return n.is_read;
    return true;
  });

  const unreadCount = notices.filter(n => !n.is_read).length;

  const getRecipientBadge = (notice) => {
    if (notice.recipient_type === "all_students") return "All Students";
    let label = "Addressed to you";
    if (notice.target_year) label += ` • Year ${notice.target_year}`;
    if (notice.target_semester) label += ` • Sem ${notice.target_semester}`;
    if (notice.target_section) label += ` • Sec ${notice.target_section}`;
    return label;
  };

  return (
    <StudentLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Notice Board</h1>
            <p className="text-gray-500 text-sm mt-1">Official notices from your Head of Department</p>
          </div>
          {unreadCount > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-medium">
              {unreadCount} unread notice{unreadCount > 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs font-medium">Total</p>
            <p className="text-3xl font-bold text-gray-800 mt-1">{notices.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs font-medium">Unread</p>
            <p className="text-3xl font-bold text-red-500 mt-1">{unreadCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs font-medium">Read</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">{notices.length - unreadCount}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 w-fit">
          {[
            { key: "all", label: `All (${notices.length})` },
            { key: "unread", label: `Unread (${unreadCount})` },
            { key: "read", label: `Read (${notices.length - unreadCount})` },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${filter === tab.key ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-700"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notices List */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading notices...</div>
        ) : filteredNotices.length > 0 ? (
          <div className="space-y-3">
            {filteredNotices.map((notice) => (
              <div key={notice.id}
                className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${!notice.is_read ? "border-indigo-200 ring-1 ring-indigo-100" : "border-gray-100"}`}>
                <div className="px-6 py-4 flex items-start gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleExpand(notice.id, notice.is_read)}>
                  <div className="flex-shrink-0 mt-1">
                    {!notice.is_read
                      ? <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></div>
                      : <div className="w-3 h-3 rounded-full bg-gray-200"></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <h3 className={`font-semibold ${!notice.is_read ? "text-gray-900" : "text-gray-600"}`}>
                        {notice.title}
                      </h3>
                      {!notice.is_read && (
                        <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full flex-shrink-0">New</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs text-gray-500">From: {notice.sent_by}</span>
                      {notice.sent_by_department && (
                        <span className="text-xs text-gray-400">({notice.sent_by_department})</span>
                      )}
                      <span className="text-xs text-gray-400">{formatDate(notice.created_at)}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                        {getRecipientBadge(notice)}
                      </span>
                    </div>
                  </div>
                  <span className="text-gray-400 flex-shrink-0">
                    {expandedNotice === notice.id ? "▲" : "▼"}
                  </span>
                </div>
                {expandedNotice === notice.id && (
                  <div className="px-6 py-5 border-t border-gray-100 bg-gray-50">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{notice.content}</p>
                    <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
                      <p className="text-xs text-gray-400">Sent on {formatDate(notice.created_at)}</p>
                      {notice.is_read && <span className="text-xs text-emerald-600 font-medium">✓ Read</span>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <p className="text-5xl mb-3">📢</p>
            <p className="font-semibold text-gray-600">
              {filter === "unread" ? "No unread notices" : filter === "read" ? "No read notices yet" : "No notices yet"}
            </p>
            <p className="text-sm mt-1">Notices from your HOD will appear here</p>
          </div>
        )}

      </div>
    </StudentLayout>
  );
}