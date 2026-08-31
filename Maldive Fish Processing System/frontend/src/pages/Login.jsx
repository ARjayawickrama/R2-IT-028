import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error: authError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
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
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background Decorator Circles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-cyan-100/60 blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Logo & Title */}
        <div className="flex justify-center items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/25 text-white">
            🐟
          </div>
          <div>
            <div className="font-mono font-extrabold text-2xl text-slate-900 tracking-tight leading-none">
              Fish<span className="text-blue-600">Go</span>
              <span className="text-xs text-blue-600 font-bold ml-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200">
                PRO
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 tracking-wide mt-1">
              Maldive Fish Processing System
            </p>
          </div>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80">
          
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Sign In to Station
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your authorized operator credentials
            </p>
          </div>

          {/* Auth Error Banner */}
          {authError && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle size={16} className="text-rose-500 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Operator Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="operator@fishgo.io"
                  className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:bg-white transition-all ${
                    errors.email
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
              </div>
              {errors.email && (
                <p className="mt-1 text-[11px] font-semibold text-rose-500">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:bg-white transition-all ${
                    errors.password
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[11px] font-semibold text-rose-500">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-xs text-slate-600 font-medium cursor-pointer">
                Keep me signed in on this station
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating Station...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Quick Switch to Signup */}
          <div className="mt-6 text-center pt-4 border-t border-slate-100 text-xs text-slate-500">
            Don't have an operator account?{' '}
            <Link to="/signup" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
              Create one now
            </Link>
          </div>

          {/* Security Badge */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[10.5px] text-slate-400 font-mono">
            <ShieldCheck size={13} className="text-emerald-500" />
            <span>256-bit Encrypted SCADA Session</span>
          </div>
        </div>
      </div>
    </div>
  );
}