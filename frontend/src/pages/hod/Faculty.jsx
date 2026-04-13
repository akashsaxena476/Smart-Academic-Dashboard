import { useState, useEffect } from "react";
import HODLayout from "../../components/shared/HODLayout";
import API from "../../api/axios";

export default function HODFaculty() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedFaculty, setExpandedFaculty] = useState(null);

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const res = await API.get("/users/hod/faculty/");
      setFaculty(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <HODLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Faculty</h1>
          <p className="text-gray-500 text-sm mt-1">View all faculty members teaching in your year groups</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs font-medium">Total Faculty</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">{faculty.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs font-medium">Total Subjects Covered</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">
              {faculty.reduce((sum, f) => sum + f.subjects_count, 0)}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-gray-500 text-xs font-medium">Total Sessions Taken</p>
            <p className="text-3xl font-bold text-emerald-600 mt-1">
              {faculty.reduce((sum, f) => sum + f.total_sessions, 0)}
            </p>
          </div>
        </div>

        {/* Faculty List */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading faculty...</div>
        ) : faculty.length > 0 ? (
          <div className="space-y-4">
            {faculty.map((member) => (
              <div key={member.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                {/* Faculty Row */}
                <div
                  className="px-6 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedFaculty(expandedFaculty === member.id ? null : member.id)}
                >
                  {/* Avatar */}
                  <div className="bg-amber-100 text-amber-700 w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {member.name[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{member.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {member.employee_id} • {member.designation} • {member.email}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-center hidden sm:block">
                      <p className="text-xs text-gray-500">Subjects</p>
                      <p className="text-lg font-bold text-indigo-600">{member.subjects_count}</p>
                    </div>
                    <div className="text-center hidden sm:block">
                      <p className="text-xs text-gray-500">Sessions</p>
                      <p className="text-lg font-bold text-emerald-600">{member.total_sessions}</p>
                    </div>
                    <span className="text-gray-400 text-sm">
                      {expandedFaculty === member.id ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {/* Expanded Subject Details */}
                {expandedFaculty === member.id && (
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                      Subjects Teaching
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {member.subjects.map((sub, idx) => (
                        <div key={idx} className="bg-white rounded-xl p-3 border border-gray-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{sub.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{sub.code}</p>
                            </div>
                            <span className="text-xs bg-amber-50 text-amber-600 font-medium px-2 py-1 rounded-lg">
                              Sem {sub.semester}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <p className="text-5xl mb-3">👨‍🏫</p>
            <p className="text-sm">No faculty found for your year groups</p>
          </div>
        )}

      </div>
    </HODLayout>
  );
}