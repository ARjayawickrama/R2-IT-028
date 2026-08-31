import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../services/api';
import { Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      setMessage('');
      const response = await axiosInstance.post('/auth/forgot-password', { email });

      setMessage(`Reset token generated successfully!`);
      setResetToken(response.data.resetToken);
      setEmail('');
    } catch (error) {
      console.error('Forgot password error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error sending reset link';
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

      {/* Main Authentication Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80">
          
          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Reset Password
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your registered work email to receive password reset instructions
            </p>
          </div>

          {/* Feedback Message */}
          {message && (
            <div className={`mb-5 p-3 rounded-xl text-xs flex items-center gap-2.5 ${
              message.includes('Error')
                ? 'bg-rose-50 border border-rose-200 text-rose-700'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            }`}>
              {message.includes('Error') ? (
                <AlertCircle size={16} className="text-rose-500 flex-shrink-0" />
              ) : (
                <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
              )}
              <span>{message}</span>
            </div>
          )}

          {!resetToken ? (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Registered Operator Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
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

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generating Security Token...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 mb-4 space-y-2">
              <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <KeyRound size={15} className="text-blue-600" />
                Security Token Generated!
              </div>
              <p className="text-[11px] text-blue-800">
                Use the token below to set your new password:
              </p>
              <code className="block bg-white p-2.5 rounded-lg text-xs font-mono text-slate-800 overflow-x-auto border border-blue-200 font-bold select-all">
                {resetToken}
              </code>
              <Link
                to={`/reset-password/${resetToken}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 mt-2"
              >
                Proceed to Reset Password Page <ArrowRight size={13} />
              </Link>
            </div>
          )}

          {/* Return Links */}
          <div className="mt-6 text-center pt-4 border-t border-slate-100 space-y-1 text-xs text-slate-500">
            <div>
              Remember your credentials?{' '}
              <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
                Sign In
              </Link>
            </div>
            <div>
              Need an account?{' '}
              <Link to="/signup" className="font-bold text-blue-600 hover:text-blue-700 hover:underline">
                Sign Up
              </Link>
            </div>
          </div>

          {/* Security Badge */}
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[10.5px] text-slate-400 font-mono">
            <ShieldCheck size={13} className="text-emerald-500" />
            <span>Encrypted Authentication Gateway</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
