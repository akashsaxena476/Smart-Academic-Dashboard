import { useState, useEffect } from "react";
import StudentLayout from "../../components/shared/StudentLayout";
import API from "../../api/axios";
import { FileText, Pin, BookOpen, ScrollText, File } from "../../components/shared/icons";

const resourceTypeColors = {
  notes: { bg: "bg-blue-50", text: "text-blue-600", Icon: FileText },
  assignment: { bg: "bg-orange-50", text: "text-orange-600", Icon: Pin },
  reference: { bg: "bg-green-50", text: "text-green-600", Icon: BookOpen },
  pyq: { bg: "bg-purple-50", text: "text-purple-600", Icon: ScrollText },
  other: { bg: "bg-gray-50", text: "text-gray-600", Icon: File },
};

export default function StudentResources() {
  const [resources, setResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchResources();
    fetchSubjects();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      let url = "/resources/student/?";
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

  const handleFilter = (e) => {
    e.preventDefault();
    fetchResources();
  };

  const handleClear = () => {
    setSelectedSubject("");
    setSelectedType("");
    setSearchQuery("");
    setTimeout(() => fetchResources(), 100);
  };

  const handleMarkViewed = async (resourceId) => {
    try {
      await API.post(`/resources/${resourceId}/viewed/`);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredResources = resources.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.subject_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = filteredResources.reduce((acc, r) => {
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
          <h1 className="text-2xl font-bold text-gray-800">Resources</h1>
          <p className="text-gray-500 text-sm mt-1">Study materials shared by your faculty</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(resourceTypeColors).map(([type, style]) => {
            const count = resources.filter((r) => r.resource_type === type).length;
            const Icon = style.Icon;
            return (
              <div key={type} className={`${style.bg} rounded-2xl p-4`}>
                <Icon className={`w-8 h-8 ${style.text}`} strokeWidth={2} />
                <p className="text-lg font-bold mt-1 text-gray-800">{count}</p>
                <p className={`text-xs font-medium capitalize ${style.text}`}>
                  {type === "pyq" ? "Prev. Year Q" : type}
                </p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <form onSubmit={handleFilter} className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 min-w-48"
            />
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
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              <option value="notes">Notes</option>
              <option value="assignment">Assignment</option>
              <option value="reference">Reference</option>
              <option value="pyq">Previous Year Q</option>
              <option value="other">Other</option>
            </select>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Filter
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

        {/* Resources Grouped by Subject */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading resources...</div>
        ) : Object.keys(grouped).length > 0 ? (
          Object.entries(grouped).map(([subjectName, subjectResources]) => (
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
                  {subjectResources.length} resource{subjectResources.length > 1 ? "s" : ""}
                </span>
              </div>

              {/* Resource Cards */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {subjectResources.map((r) => {
                  const style = resourceTypeColors[r.resource_type] || resourceTypeColors.other;
                  const Icon = style.Icon;
                  return (
                    <div key={r.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
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
                            <span className="text-xs text-gray-400">by {r.uploaded_by_name}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(r.uploaded_at).toLocaleDateString("en-IN")}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                        <a href={r.file_url} target="_blank" rel="noopener noreferrer" onClick={() => handleMarkViewed(r.id)} className="mt-3 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors" >

                        Download / View
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 text-gray-400">
            <BookOpen className="w-14 h-14 mx-auto mb-3 opacity-50" strokeWidth={1.5} />
            <p className="text-sm">No resources found</p>
          </div>
        )}

      </div>
    </StudentLayout>
  );
}