import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axiosInstance from '../services/api';
import { Lock, Eye, EyeOff, KeyRound, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
  const [formData, setFormData] = useState({ token: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { token: urlToken } = useParams();

  const getToken = () => urlToken || formData.token;

  const validateForm = () => {
    const newErrors = {};

    if (!getToken()) {
      newErrors.token = 'Reset security token is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const token = getToken();
      const response = await axiosInstance.post(`/auth/reset-password/${token}`, {
        password: formData.password,
      });

      setMessage('Password updated successfully! Redirecting to station dashboard...');
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
    } catch (error) {
      console.error('Reset password error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error resetting password';
      setMessage(errorMsg);
    } finally {
      setLoading(false);
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

      {/* Main Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Create New Password
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your token and set your new account password
            </p>
          </div>

          {/* Feedback Message */}
          {message && (
            <div
              className={`mb-5 p-3 rounded-xl text-xs flex items-center gap-2.5 ${
                message.includes('Error') || message.includes('failed')
                  ? 'bg-rose-50 border border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              }`}
            >
              {message.includes('Error') || message.includes('failed') ? (
                <AlertCircle size={16} className="text-rose-500 flex-shrink-0" />
              ) : (
                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
              )}
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Token Field (shown only if not in URL) */}
            {!urlToken && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reset Token
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="token"
                    value={formData.token}
                    onChange={handleChange}
                    placeholder="Paste reset token here"
                    className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:bg-white font-mono transition-all ${
                      errors.token
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    }`}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound size={16} />
                  </div>
                </div>
                {errors.token && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-500">
                    {errors.token}
                  </p>
                )}
              </div>
            )}

            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter new password"
                  className={`w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:bg-white transition-all ${
                    errors.confirmPassword
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }`}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-[11px] font-semibold text-rose-500">
                  {errors.confirmPassword}
                </p>
              )}
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
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Reset & Sign In</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center pt-4 border-t border-slate-100 text-xs text-slate-500">
            Back to{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
              Sign In
            </Link>
          </div>

          {/* Security Badge */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[10.5px] text-slate-400 font-mono">
            <ShieldCheck size={13} className="text-emerald-500" />
            <span>End-to-End Encrypted Credential Reset</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
