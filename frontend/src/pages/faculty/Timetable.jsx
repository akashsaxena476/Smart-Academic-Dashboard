import { useState, useEffect } from "react";
import FacultyLayout from "../../components/shared/FacultyLayout";
import API from "../../api/axios";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const subjectColors = [
  { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", dot: "bg-indigo-500" },
  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", dot: "bg-purple-500" },
  { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", dot: "bg-orange-500" },
  { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700", dot: "bg-pink-500" },
];

export default function FacultyTimetable() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("week");
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

  useEffect(() => {
    fetchTimetable();
  }, []);

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const res = await API.get("/academics/faculty-timetable/");
      setTimetable(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getByDay = (day) => timetable.filter((t) => t.day === day);
  const todayClasses = getByDay(today);

  // Assign consistent color per subject
  const subjectColorMap = {};
  let colorIndex = 0;
  timetable.forEach((t) => {
    if (!subjectColorMap[t.subject_code]) {
      subjectColorMap[t.subject_code] = subjectColors[colorIndex % subjectColors.length];
      colorIndex++;
    }
  });

  if (loading) return (
    <FacultyLayout>
      <div className="flex items-center justify-center h-64 text-gray-400">Loading timetable...</div>
    </FacultyLayout>
  );

  return (
    <FacultyLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Timetable</h1>
            <p className="text-gray-500 text-sm mt-1">Your weekly teaching schedule</p>
          </div>
          <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100">
            <button
              onClick={() => setView("week")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === "week" ? "bg-emerald-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
            >
              Week View
            </button>
            <button
              onClick={() => setView("today")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === "today" ? "bg-emerald-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
            >
              Today
            </button>
          </div>
        </div>

        {/* Summary Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-4 text-white flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-emerald-200 text-xs font-medium uppercase tracking-wide">Today</p>
            <p className="text-lg font-bold capitalize mt-0.5">{today}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-black bg-opacity-25 rounded-xl px-4 py-2 text-center min-w-20">
              <p className="text-2xl font-bold text-white">{todayClasses.length}</p>
              <p className="text-xs text-emerald-200">Classes Today</p>
            </div>
            <div className="bg-black bg-opacity-25 rounded-xl px-4 py-2 text-center min-w-20">
              <p className="text-2xl font-bold text-white">{timetable.length}</p>
              <p className="text-xs text-emerald-200">Total/Week</p>
            </div>
            <div className="bg-black bg-opacity-25 rounded-xl px-4 py-2 text-center min-w-20">
              <p className="text-2xl font-bold text-white">{[...new Set(timetable.map(t => t.subject_code))].length}</p>
              <p className="text-xs text-emerald-200">Subjects</p>
            </div>
          </div>
        </div>

        {/* Subject Legend */}
        {timetable.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Subject Legend</p>
            <div className="flex flex-wrap gap-2">
              {[...new Set(timetable.map(t => t.subject_code))].map((code) => {
                const style = subjectColorMap[code];
                const subject = timetable.find(t => t.subject_code === code);
                return (
                  <div key={code} className={`${style.bg} border ${style.border} rounded-xl px-3 py-1.5 flex items-center gap-2`}>
                    <div className={`w-2 h-2 rounded-full ${style.dot}`}></div>
                    <span className={`text-xs font-semibold ${style.text}`}>{code}</span>
                    <span className="text-xs text-gray-500">{subject?.subject_name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Today View */}
        {view === "today" && (
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-800 capitalize">
              {today}'s Schedule
            </h2>
            {todayClasses.length > 0 ? (
              todayClasses.map((cls) => {
                const style = subjectColorMap[cls.subject_code] || subjectColors[0];
                return (
                  <div key={cls.id} className={`${style.bg} border ${style.border} rounded-2xl p-5 flex items-center gap-4`}>
                    <div className={`${style.dot} w-1 h-16 rounded-full flex-shrink-0`}></div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-base ${style.text}`}>{cls.subject_name}</h3>
                      <p className="text-gray-500 text-sm mt-0.5">{cls.subject_code}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        Section {cls.section} • Semester {cls.semester}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${style.text}`}>{cls.start_time}</p>
                      <p className="text-xs text-gray-400 mt-0.5">to</p>
                      <p className="text-sm font-semibold text-gray-600">{cls.end_time}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
                <p className="text-5xl mb-3">🎉</p>
                <p className="font-semibold text-gray-600">No classes today!</p>
                <p className="text-sm mt-1">Enjoy your free day</p>
              </div>
            )}
          </div>
        )}

        {/* Week View */}
        {view === "week" && (
          <div className="space-y-4">
            {DAYS.map((day) => {
              const classes = getByDay(day);
              const isToday = day === today;
              return (
                <div key={day} className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isToday ? "border-emerald-300 ring-2 ring-emerald-100" : "border-gray-100"}`}>

                  {/* Day Header */}
                  <div className={`px-5 py-3 flex items-center justify-between ${isToday ? "bg-emerald-600" : "bg-gray-50"}`}>
                    <div className="flex items-center gap-2">
                      {isToday && <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>}
                      <h3 className={`font-semibold capitalize text-sm ${isToday ? "text-white" : "text-gray-700"}`}>
                        {day} {isToday && "(Today)"}
                      </h3>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isToday ? "bg-white bg-opacity-20 text-white" : "bg-gray-100 text-gray-600"}`}>
                      {classes.length} {classes.length === 1 ? "class" : "classes"}
                    </span>
                  </div>

                  {/* Classes */}
                  {classes.length > 0 ? (
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {classes.map((cls) => {
                        const style = subjectColorMap[cls.subject_code] || subjectColors[0];
                        return (
                          <div key={cls.id} className={`${style.bg} border ${style.border} rounded-xl p-4`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className={`font-semibold text-sm ${style.text} truncate`}>{cls.subject_name}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">{cls.subject_code}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Section {cls.section} • Sem {cls.semester}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className={`text-xs font-bold ${style.text}`}>{cls.start_time}</p>
                                <p className="text-xs text-gray-400">—</p>
                                <p className="text-xs font-semibold text-gray-500">{cls.end_time}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-5 py-4 text-gray-400 text-sm">
                      No classes scheduled
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {timetable.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <p className="text-5xl mb-3">🗓️</p>
            <p className="font-semibold text-gray-600">No timetable found</p>
            <p className="text-sm mt-1">Your timetable will appear once it's configured</p>
          </div>
        )}

      </div>
    </FacultyLayout>
  );
}