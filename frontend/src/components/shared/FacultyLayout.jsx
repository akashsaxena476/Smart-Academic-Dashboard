import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";
import {
  Home, ClipboardList, BookOpen, BarChart3,
  User, Calendar, Menu, LogOut, BookMarked, Users, Bell
} from "lucide-react";

const navItems = [
  { path: "/faculty/home", label: "Home", Icon: Home },
  { path: "/faculty/attendance", label: "Attendance", Icon: ClipboardList },
  { path: "/faculty/resources", label: "Resources", Icon: BookOpen },
  { path: "/faculty/marks", label: "Exam Marks", Icon: BarChart3 },
  { path: "/faculty/students", label: "Students", Icon: Users },
  { path: "/faculty/timetable", label: "Timetable", Icon: Calendar },
  { path: "/faculty/notices", label: "Notice Board", Icon: Bell },
  { path: "/faculty/profile", label: "Profile", Icon: User },
];

export default function FacultyLayout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30
        ${sidebarOpen ? "w-64 translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-64"}
        bg-emerald-900 text-white flex flex-col transition-all duration-300
      `}>

        {/* Logo */}
        <div className="p-5 border-b border-emerald-700 flex items-center gap-3">
          <div className="bg-emerald-500 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0">
            <BookMarked size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">Smart Academic</p>
            <p className="text-emerald-300 text-xs">Faculty Portal</p>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ path, label, Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                ${location.pathname === path
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
                  : "text-emerald-200 hover:bg-emerald-800 hover:text-white"
                }`}
            >
              <Icon size={18} className="flex-shrink-0" />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-emerald-700">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.first_name} {user?.last_name}</p>
              <p className="text-emerald-300 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top Navbar */}
        <header className="bg-white shadow-sm px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden text-gray-500 hover:text-emerald-600 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-base lg:text-lg font-semibold text-gray-800 truncate">
              {navItems.find(n => n.path === location.pathname)?.label || "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            <NotificationBell />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-800 truncate max-w-32">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-emerald-600 font-medium capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>

      </div>
    </div>
  );
}