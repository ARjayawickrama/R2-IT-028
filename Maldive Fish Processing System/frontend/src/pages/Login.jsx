import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const { login, error: authError, loading } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <>
      {/* Desktop Application Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <span className="text-blue-800 font-bold text-sm">MF</span>
              </div>
              <div>
                <h1 className="text-lg font-bold">Maldive Fish Processing System</h1>
                <p className="text-xs text-blue-200">Enterprise Control Panel v2.0</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>System Online</span>
            </div>
            <div className="text-sm text-blue-200">
              {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
            </div>
            <div className="flex gap-1">
              <button className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded text-sm">Minimize</button>
              <button className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded text-sm">Maximize</button>
              <button className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-sm">Close</button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Menu Bar */}
      <div className="bg-gray-800 text-white border-b border-gray-700">
        <div className="flex items-center px-2 py-1">
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 hover:bg-gray-700 rounded text-sm">File</button>
            <button className="px-3 py-1 hover:bg-gray-700 rounded text-sm">Edit</button>
            <button className="px-3 py-1 hover:bg-gray-700 rounded text-sm">View</button>
            <button className="px-3 py-1 hover:bg-gray-700 rounded text-sm">Tools</button>
            <button className="px-3 py-1 hover:bg-gray-700 rounded text-sm">Reports</button>
            <button className="px-3 py-1 hover:bg-gray-700 rounded text-sm">Help</button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="px-2 py-1 hover:bg-gray-700 rounded text-xs">⚙️ Settings</button>
            <button className="px-2 py-1 hover:bg-gray-700 rounded text-xs">🔔 Notifications</button>
            <button className="px-2 py-1 hover:bg-gray-700 rounded text-xs">👤 Admin</button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex bg-gray-100 min-h-screen">
        {/* Login Form Container */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-200">
            {/* Login Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-xl">
              <div className="flex justify-center mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-white/30 rounded-full animate-pulse"></div>
                  <div className="w-4 h-4 bg-white/30 rounded-full animate-pulse delay-75"></div>
                  <div className="w-4 h-4 bg-white/30 rounded-full animate-pulse delay-150"></div>
                  <div className="w-4 h-4 bg-white/30 rounded-full animate-pulse delay-300"></div>
                  <span className="text-2xl font-bold ml-3">FishGo Admin</span>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-center">Welcome Back</h1>
              <p className="text-center text-blue-100 text-sm mt-1">Manage your fish processing system with ease</p>
            </div>

            {/* Login Form */}
            <div className="p-6">
              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {authError}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your email"
                    />
                    <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1 flex items-center"><svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{errors.email}</p>}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your password"
                    />
                    <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1 flex items-center"><svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{errors.password}</p>}
                </div>

                <div className="flex items-center justify-between mb-8">
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-700">Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">Forgot password?</Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              <p className="text-center text-gray-700 text-sm mt-6">
                Don't have an account? <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">Sign up for free</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
