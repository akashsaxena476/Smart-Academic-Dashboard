import { useState, useEffect } from "react";
import FacultyLayout from "../../components/shared/FacultyLayout";
import API from "../../api/axios";
import { FileText, Pin, BookOpen, ScrollText, File } from "../../components/shared/icons";

const resourceTypeColors = {
  notes: { bg: "bg-blue-50", text: "text-blue-600", Icon: FileText },
  assignment: { bg: "bg-orange-50", text: "text-orange-600", Icon: Pin },
  reference: { bg: "bg-green-50", text: "text-green-600", Icon: BookOpen },
  pyq: { bg: "bg-purple-50", text: "text-purple-600", Icon: ScrollText },
  other: { bg: "bg-gray-50", text: "text-gray-600", Icon: File },
};

export default function FacultyResources() {
  const [resources, setResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [editingResource, setEditingResource] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    resource_type: "notes",
    subject: "",
    file: null,
  });

  useEffect(() => {
    fetchResources();
    fetchSubjects();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      let url = "/resources/faculty/?";
      if (selectedSubject) url += `subject_id=${selectedSubject}&`;
      if (selectedType) url += `resource_type=${selectedType}&`;
      const res = await API.get(url);
      setResources(res.data);
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

  const handleFormChange = (e) => {
    if (e.target.name === "file") {
      setFormData({ ...formData, file: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (!formData.title || !formData.subject || !formData.file) {
      setErrorMsg("Title, subject and file are required");
      return;
    }
    setUploading(true);
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("resource_type", formData.resource_type);
      data.append("subject", formData.subject);
      data.append("file", formData.file);
      await API.post("/resources/upload/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccessMsg("Resource uploaded successfully!");
      setFormData({ title: "", description: "", resource_type: "notes", subject: "", file: null });
      document.getElementById("fileInput").value = "";
      fetchResources();
      setActiveTab("manage");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (resourceId) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;
    try {
      await API.delete(`/resources/${resourceId}/`);
      setSuccessMsg("Resource deleted successfully!");
      fetchResources();
    } catch (err) {
      setErrorMsg("Failed to delete resource");
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/resources/${editingResource.id}/`, {
        title: editingResource.title,
        description: editingResource.description,
        resource_type: editingResource.resource_type,
      });
      setSuccessMsg("Resource updated successfully!");
      setEditingResource(null);
      fetchResources();
    } catch (err) {
      setErrorMsg("Failed to update resource");
    }
  };

  return (
    <FacultyLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Resources</h1>
          <p className="text-gray-500 text-sm mt-1">Upload and manage study materials for students</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 w-fit">
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "upload" ? "bg-emerald-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
          >
            Upload Resource
          </button>
          <button
            onClick={() => { setActiveTab("manage"); fetchResources(); }}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "manage" ? "bg-emerald-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
          >
            Manage Resources
          </button>
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

        {/* Upload Tab */}
        {activeTab === "upload" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-2xl">
            <h3 className="font-semibold text-gray-800 mb-5">Upload New Resource</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="e.g. Unit 1 Notes - Data Structures"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Brief description of the resource"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type *</label>
                  <select
                    name="resource_type"
                    value={formData.resource_type}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="notes">Notes</option>
                    <option value="assignment">Assignment</option>
                    <option value="reference">Reference Material</option>
                    <option value="pyq">Previous Year Questions</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                <input
                  id="fileInput"
                  type="file"
                  name="file"
                  onChange={handleFormChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.zip,.txt,.png,.jpg"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-emerald-50 file:text-emerald-600 hover:file:bg-emerald-100"
                />
                <p className="text-xs text-gray-400 mt-1">Supported: PDF, DOC, PPT, XLSX, ZIP, images</p>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload Resource"}
              </button>
            </form>
          </div>
        )}

        {/* Manage Tab */}
        {activeTab === "manage" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex flex-wrap gap-3">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Types</option>
                  <option value="notes">Notes</option>
                  <option value="assignment">Assignment</option>
                  <option value="reference">Reference</option>
                  <option value="pyq">Previous Year Q</option>
                  <option value="other">Other</option>
                </select>
                <button
                  onClick={fetchResources}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Filter
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-16 text-gray-400 text-sm">Loading resources...</div>
            ) : resources.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {resources.map((r) => {
                  const style = resourceTypeColors[r.resource_type] || resourceTypeColors.other;
                  const Icon = style.Icon;
                  return (
                    <div key={r.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                      {editingResource?.id === r.id ? (
                        <form onSubmit={handleEdit} className="space-y-3">
                          <input
                            type="text"
                            value={editingResource.title}
                            onChange={(e) => setEditingResource({ ...editingResource, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <textarea
                            value={editingResource.description || ""}
                            onChange={(e) => setEditingResource({ ...editingResource, description: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                          />
                          <select
                            value={editingResource.resource_type}
                            onChange={(e) => setEditingResource({ ...editingResource, resource_type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="notes">Notes</option>
                            <option value="assignment">Assignment</option>
                            <option value="reference">Reference</option>
                            <option value="pyq">Previous Year Q</option>
                            <option value="other">Other</option>
                          </select>
                          <div className="flex gap-2">
                            <button type="submit"
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm py-2 rounded-lg font-medium">
                              Save
                            </button>
                            <button type="button" onClick={() => setEditingResource(null)}
                              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm py-2 rounded-lg font-medium">
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-start gap-3">
                            <div className={`${style.bg} w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${style.text}`}>
                              <Icon className="w-5 h-5" strokeWidth={2} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-800 text-sm truncate">{r.title}</h4>
                              {r.description && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${style.bg} ${style.text}`}>
                                  {r.resource_type === "pyq" ? "Prev. Year Q" : r.resource_type}
                                </span>
                                <span className="text-xs text-gray-400">{r.subject_name}</span>
                                <span className="text-xs text-gray-400">
                                  {new Date(r.uploaded_at).toLocaleDateString("en-IN")}
                                </span>
                                <span className="text-xs text-gray-400">{r.total_views} views</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4">
                            <a
                              href={r.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-center bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-semibold py-2 rounded-lg transition-colors"
                            >
                              View File
                            </a>
                            <button
                              onClick={() => setEditingResource(r)}
                              className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-semibold py-2 rounded-lg transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(r.id)}
                              className="flex-1 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold py-2 rounded-lg transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <BookOpen className="w-14 h-14 mx-auto mb-3 opacity-50" strokeWidth={1.5} />
                <p className="text-sm">No resources uploaded yet</p>
              </div>
            )}
          </div>
        )}

      </div>
    </FacultyLayout>
  );
}