import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../api/axios";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    enrollment_number: "",
    branch: "",
    semester: "",
    section: "",
    date_of_birth: "",
    address: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = (e) => {
  e.preventDefault();
  setError("");

  if (!formData.first_name || !formData.last_name || !formData.username || !formData.email || !formData.password || !formData.confirm_password) {
    setError("Please fill all required fields");
    return;
  }

  const { checks } = validatePassword(formData.password);
  if (!checks.length) {
    setError("Password must be at least 8 characters");
    return;
  }
  if (!checks.uppercase) {
    setError("Password must contain at least 1 uppercase letter");
    return;
  }
  if (!checks.lowercase) {
    setError("Password must contain at least 1 lowercase letter");
    return;
  }
  if (!checks.number) {
    setError("Password must contain at least 1 number");
    return;
  }
  if (!checks.special) {
    setError("Password must contain at least 1 special character (!@#$%^&*)");  
    return;
  }
  if (formData.password !== formData.confirm_password) {
    setError("Passwords do not match");
    return;
  }

  setStep(2);
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await API.post("/users/register/", {
        ...formData,
        semester: parseInt(formData.semester),
      });
      navigate("/login");
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === "object") {
        const first = Object.values(errors)[0];
        setError(Array.isArray(first) ? first[0] : first);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };
  const validatePassword = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
  const strength = Object.values(checks).filter(Boolean).length;
  return { checks, strength };
};

const getStrengthLabel = (strength) => {
  if (strength <= 1) return { label: "Very Weak", color: "bg-red-500", textColor: "text-red-500" };
  if (strength === 2) return { label: "Weak", color: "bg-orange-500", textColor: "text-orange-500" };
  if (strength === 3) return { label: "Fair", color: "bg-yellow-500", textColor: "text-yellow-500" };
  if (strength === 4) return { label: "Strong", color: "bg-blue-500", textColor: "text-blue-500" };
  return { label: "Very Strong", color: "bg-green-500", textColor: "text-green-500" };
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="bg-indigo-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
            SA
          </div>
          <h1 className="text-2xl font-bold text-white text-gray-800">Student Registration</h1>
          <p className="text-gray-500 text-sm mt-1">Create your student account</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"}`}>1</div>
          <div className={`h-1 w-16 mx-2 rounded ${step >= 2 ? "bg-indigo-600" : "bg-gray-200"}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"}`}>2</div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Step 1 - Account Info */}
        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-4">
            <p className="text-sm font-semibold text-gray-600 mb-2">Step 1 — Account Information</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input type="text" name="first_name" value={formData.first_name} onChange={handleChange}
                  placeholder="John" required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input type="text" name="last_name" value={formData.last_name} onChange={handleChange}
                  placeholder="Doe" required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
              <input type="text" name="username" value={formData.username} onChange={handleChange}
                placeholder="john_doe123" required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="john@example.com" required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange}
                placeholder="9999999999"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
  <input
    type="password"
    name="password"
    value={formData.password}
    onChange={handleChange}
    placeholder="Min 8 characters"
    required
    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
  />
  {formData.password.length > 0 && (() => {
    const { checks, strength } = validatePassword(formData.password);
    const { label, color, textColor } = getStrengthLabel(strength);
    return (
      <div className="mt-2 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? color : "bg-gray-200"}`}
              ></div>
            ))}
          </div>
          <span className={`text-xs font-semibold ${textColor}`}>{label}</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {[
            { key: "length", label: "Min 8 characters" },
            { key: "uppercase", label: "1 Uppercase letter" },
            { key: "lowercase", label: "1 Lowercase letter" },
            { key: "number", label: "1 Number" },
            { key: "special", label: "1 Special character" },
          ].map((item) => (
            <div key={item.key} className="flex items-center gap-1.5">
              <span className={`text-xs font-bold ${checks[item.key] ? "text-green-500" : "text-gray-300"}`}>
                {checks[item.key] ? "✓" : "✗"}
              </span>
              <span className={`text-xs ${checks[item.key] ? "text-green-600" : "text-gray-400"}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  })()}
</div>

<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
  <input
    type="password"
    name="confirm_password"
    value={formData.confirm_password}
    onChange={handleChange}
    placeholder="Repeat password"
    required
    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm ${formData.confirm_password.length > 0
      ? formData.password === formData.confirm_password
        ? "border-green-400 bg-green-50"
        : "border-red-400 bg-red-50"
      : "border-gray-300"
      }`}
  />
  {formData.confirm_password.length > 0 && (
    <p className={`text-xs mt-1 font-medium ${formData.password === formData.confirm_password ? "text-green-600" : "text-red-500"}`}>
      {formData.password === formData.confirm_password ? "✓ Passwords match" : "✗ Passwords do not match"}
    </p>
  )}
</div>
            <button type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition duration-200 text-sm mt-2">
              Next →
            </button>
          </form>
        )}

        {/* Step 2 - Academic Info */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm font-semibold text-gray-600 mb-2">Step 2 — Academic Information</p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment Number *</label>
              <input type="text" name="enrollment_number" value={formData.enrollment_number} onChange={handleChange}
                placeholder="EN2021001" required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch *</label>
              <select name="branch" value={formData.branch} onChange={handleChange} required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                <option value="">Select Branch</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                <select name="semester" value={formData.semester} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                  <option value="">Select</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                <select name="section" value={formData.section} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                  <option value="">Select</option>
                  {["A","B","C","D"].map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea name="address" value={formData.address} onChange={handleChange}
                placeholder="Your address"
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none" />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)}
                className="w-full border border-indigo-600 text-indigo-600 font-semibold py-3 rounded-lg transition duration-200 text-sm">
                ← Back
              </button>
              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition duration-200 text-sm disabled:opacity-50">
                {loading ? "Registering..." : "Register"}
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Sign in</Link>
        </p>

      </div>
    </div>
  );
}