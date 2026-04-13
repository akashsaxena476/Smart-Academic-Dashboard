import { useState, useEffect } from "react";
import StudentLayout from "../../components/shared/StudentLayout";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

export default function StudentProfile() {
  const { user, login, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

const [fullProfile, setFullProfile] = useState(null);

useEffect(() => {
  fetchFullProfile();
}, []);

const fetchFullProfile = async () => {
  try {
    const res = await API.get("/users/profile/");
    setFullProfile(res.data);
    setProfileData({
      first_name: res.data.first_name || "",
      last_name: res.data.last_name || "",
      email: res.data.email || "",
      phone: res.data.phone || "",
    });
  } catch (err) {
    console.error(err);
  }
};

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      const res = await API.put("/users/profile/update/", profileData);
      login(res.data, token, localStorage.getItem("refresh_token"));
      setSuccessMsg("Profile updated successfully!");
    } catch (err) {
      setErrorMsg("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (passwordData.new_password !== passwordData.confirm_password) {
      setErrorMsg("New passwords do not match");
      return;
    }
    if (passwordData.new_password.length < 8) {
      setErrorMsg("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await API.post("/users/change-password/", {
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });
      setSuccessMsg("Password changed successfully!");
      setPasswordData({ old_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-6 max-w-3xl mx-auto relative z-0 bg-transparent">

        {/* Header Card */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 pb-6 text-white shadow-lg relative z-10 overflow-visible">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
              {fullProfile?.first_name?.[0]}{fullProfile?.last_name?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-white">{fullProfile?.first_name} {fullProfile?.last_name}</h1>
              <p className="text-white/90 text-sm mt-0.5">{fullProfile?.email}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="bg-white/25 text-white text-xs px-3 py-1.5 rounded-full font-medium capitalize">
                  {fullProfile?.role}
                </span>
                {fullProfile?.student_profile && (
                  <span className="bg-white/25 text-white text-xs px-3 py-1.5 rounded-full font-medium">
                    {user.student_profile.branch} • Sem {user.student_profile.semester}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Academic Info Card */}
        {fullProfile?.student_profile && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Academic Information</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Enrollment No.", value: user.student_profile.enrollment_number },
                { label: "Branch", value: user.student_profile.branch },
                { label: "Semester", value: `Semester ${user.student_profile.semester}` },
                { label: "Section", value: `Section ${user.student_profile.section}` },
                { label: "Date of Birth", value: user.student_profile.date_of_birth || "—" },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 font-medium">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 w-fit">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "profile" ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
          >
            Edit Profile
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "password" ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
          >
            Change Password
          </button>
        </div>

        {/* Messages */}
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

        {/* Edit Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-5">Personal Information</h3>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={profileData.first_name}
                    onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={profileData.last_name}
                    onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        )}

        {/* Change Password Tab */}
        {activeTab === "password" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-5">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordData.old_password}
                  onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  placeholder="Min 8 characters"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  placeholder="Repeat new password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {loading ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>
        )}

      </div>
    </StudentLayout>
  );
}