import { useState, useEffect } from "react";
import HODLayout from "../../components/shared/HODLayout";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";

export default function HODProfile() {
  const { user, login, token } = useAuth();
  const [fullProfile, setFullProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState({
    first_name: "", last_name: "", email: "", phone: "",
  });
  const [passwordData, setPasswordData] = useState({
    old_password: "", new_password: "", confirm_password: "",
  });

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
    setErrorMsg(""); setSuccessMsg("");
    setLoading(true);
    try {
      const res = await API.put("/users/profile/update/", profileData);
      login(res.data, token, localStorage.getItem("refresh_token"));
      setSuccessMsg("Profile updated successfully!");
      fetchFullProfile();
    } catch (err) {
      setErrorMsg("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setErrorMsg(""); setSuccessMsg("");
    if (passwordData.new_password !== passwordData.confirm_password) {
      setErrorMsg("New passwords do not match"); return;
    }
    if (passwordData.new_password.length < 8) {
      setErrorMsg("Password must be at least 8 characters"); return;
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

  const yearGroups = [];
  if (fullProfile?.faculty_profile?.hod_year_1) yearGroups.push("1st Year (Sem 1-2)");
  if (fullProfile?.faculty_profile?.hod_year_2) yearGroups.push("2nd Year (Sem 3-4)");
  if (fullProfile?.faculty_profile?.hod_year_3) yearGroups.push("3rd Year (Sem 5-6)");
  if (fullProfile?.faculty_profile?.hod_year_4) yearGroups.push("4th Year (Sem 7-8)");

  return (
    <HODLayout>
      <div className="space-y-6 max-w-3xl mx-auto">

        {/* Header Card */}
        <div className="bg-gradient-to-r from-amber-700 to-amber-500 rounded-2xl p-6 text-white">
  <div className="flex items-center gap-4">
    <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
      {fullProfile?.first_name?.[0]}{fullProfile?.last_name?.[0]}
    </div>
    <div className="min-w-0 flex-1">
      <h1 className="text-xl font-bold text-white">{fullProfile?.first_name} {fullProfile?.last_name}</h1>
      <p className="text-white/90 text-sm mt-0.5">{fullProfile?.email}</p>
      <div className="flex flex-wrap gap-2 mt-3">
        <span className="bg-white/25 text-white text-xs px-3 py-1.5 rounded-full font-medium">
          Head of Department
        </span>
        <span className="bg-white/25 text-white text-xs px-3 py-1.5 rounded-full font-medium">
          {fullProfile?.faculty_profile?.department}
        </span>
      </div>
    </div>
  </div>
</div>

        {/* HOD Info Card */}
        {fullProfile?.faculty_profile && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">HOD Information</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              {[
                { label: "Employee ID", value: fullProfile.faculty_profile.employee_id },
                { label: "Department", value: fullProfile.faculty_profile.department },
                { label: "Designation", value: fullProfile.faculty_profile.designation || "HOD" },
                { label: "Joining Date", value: fullProfile.faculty_profile.joining_date || "—" },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 font-medium">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Year Groups */}
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">Assigned Year Groups</p>
              <div className="flex flex-wrap gap-2">
                {yearGroups.map((year) => (
                  <span key={year} className="bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-xl border border-amber-200">
                    {year}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 w-fit">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "profile" ? "bg-amber-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
          >
            Edit Profile
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "password" ? "bg-amber-600 text-white" : "text-gray-500 hover:text-gray-700"}`}
          >
            Change Password
          </button>
        </div>

        {/* Messages */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">{successMsg}</div>
        )}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{errorMsg}</div>
        )}

        {/* Edit Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-5">Personal Information</h3>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" value={profileData.first_name}
                    onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" value={profileData.last_name}
                    onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="text" value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50">
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
                <input type="password" value={passwordData.old_password}
                  onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" value={passwordData.new_password}
                  onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                  placeholder="Min 8 characters"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input type="password" value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                  placeholder="Repeat new password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg text-sm transition-colors disabled:opacity-50">
                {loading ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>
        )}

      </div>
    </HODLayout>
  );
}