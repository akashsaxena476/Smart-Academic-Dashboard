import { useState, useEffect } from "react";
import StudentLayout from "../../components/shared/StudentLayout";
import API from "../../api/axios";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const dayColors = {
  monday: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", dot: "bg-indigo-500" },
  tuesday: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", dot: "bg-purple-500" },
  wednesday: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  thursday: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  friday: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", dot: "bg-orange-500" },
  saturday: { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700", dot: "bg-pink-500" },
};

export default function StudentTimetable() {
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
      const res = await API.get("/academics/student-timetable/");
      setTimetable(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getByDay = (day) => timetable.filter((t) => t.day === day);
  const todayClasses = getByDay(today);

  if (loading) return (
    <StudentLayout>
      <div className="flex items-center justify-center h-64 text-gray-400">Loading timetable...</div>
    </StudentLayout>
  );

  return (
    <StudentLayout>
      <div className="space-y-6">

        {/* Header */}
<div className="flex items-center justify-between flex-wrap gap-3">
  <div>
    <h1 className="text-2xl font-bold text-gray-800">Timetable</h1>
    <p className="text-gray-500 text-sm mt-1">Your weekly class schedule</p>
  </div>
  <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100">
    <button
      onClick={() => setView("week")}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === "week" ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
    >
      Week View
    </button>
    <button
      onClick={() => setView("today")}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === "today" ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
    >
      Today
    </button>
  </div>
</div>

{/* Today Banner */}
{view === "week" && (
  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-4 text-white flex items-center justify-between flex-wrap gap-3">
    <div>
      <p className="text-indigo-200 text-xs font-medium uppercase tracking-wide">Today</p>
      <p className="text-lg font-bold capitalize mt-0.5">{today}</p>
    </div>
    <div className="flex items-center gap-2">
      <div className="bg-black bg-opacity-25 rounded-xl px-4 py-2 text-center min-w-20">
        <p className="text-2xl font-bold text-white">{todayClasses.length}</p>
        <p className="text-xs text-white opacity-80">Classes Today</p>
      </div>
      <div className="bg-black bg-opacity-25 rounded-xl px-4 py-2 text-center min-w-20">
        <p className="text-2xl font-bold text-white">{timetable.length}</p>
        <p className="text-xs text-white opacity-80">Total/Week</p>
      </div>
    </div>
  </div>
)}

{/* Today View */}
{view === "today" && (
  <div className="space-y-4">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></div>
      <h2 className="font-semibold text-gray-800 capitalize">
        {today}'s Schedule
      </h2>
    </div>
    {todayClasses.length > 0 ? (
      <div className="space-y-3">
        {todayClasses.map((cls) => {
          const style = dayColors[cls.day] || dayColors.monday;
          return (
            <div key={cls.id} className={`${style.bg} border ${style.border} rounded-2xl p-5 flex items-center gap-4`}>
              <div className={`${style.dot} w-1 h-16 rounded-full flex-shrink-0`}></div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-bold text-base ${style.text}`}>{cls.subject_name}</h3>
                <p className="text-gray-500 text-sm mt-0.5">{cls.subject_code} • {cls.faculty_name}</p>
                <p className="text-gray-400 text-xs mt-1">Section {cls.section}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-bold ${style.text}`}>{cls.start_time}</p>
                <p className="text-xs text-gray-400 mt-0.5">to</p>
                <p className="text-sm font-semibold text-gray-600">{cls.end_time}</p>
              </div>
            </div>
          );
        })}
      </div>
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
              const style = dayColors[day];
              const isToday = day === today;
              return (
                <div key={day} className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${isToday ? "border-indigo-300 ring-2 ring-indigo-100" : "border-gray-100"}`}>

                  {/* Day Header */}
                  <div className={`px-5 py-3 flex items-center justify-between ${isToday ? "bg-indigo-600" : "bg-gray-50"}`}>
                    <div className="flex items-center gap-2">
                      {isToday && <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>}
                      <h3 className={`font-semibold capitalize text-sm ${isToday ? "text-white" : "text-gray-700"}`}>
                        {day} {isToday && "(Today)"}
                      </h3>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isToday ? "bg-white bg-opacity-20 text-white" : `${style.bg} ${style.text}`}`}>
                      {classes.length} {classes.length === 1 ? "class" : "classes"}
                    </span>
                  </div>

                  {/* Classes */}
                  {classes.length > 0 ? (
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {classes.map((cls) => (
                        <div key={cls.id} className={`${style.bg} border ${style.border} rounded-xl p-4`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-semibold text-sm ${style.text} truncate`}>{cls.subject_name}</h4>
                              <p className="text-xs text-gray-500 mt-0.5">{cls.subject_code}</p>
                              <p className="text-xs text-gray-500 mt-1">{cls.faculty_name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">Section {cls.section}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={`text-xs font-bold ${style.text}`}>{cls.start_time}</p>
                              <p className="text-xs text-gray-400">—</p>
                              <p className="text-xs font-semibold text-gray-500">{cls.end_time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
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
            <p className="text-sm mt-1">Your timetable will appear here once it's set up</p>
          </div>
        )}

      </div>
    </StudentLayout>
  );
}