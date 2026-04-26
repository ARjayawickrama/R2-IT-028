import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  const validateForm = () => {
    const newErrors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
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
      
      setMessage(`Reset link sent! Token: ${response.data.resetToken}`);
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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
            <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
            <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
            <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
            <span className="text-2xl font-bold text-blue-900 ml-2">FishGo</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Reset Password</h1>
        <p className="text-center text-gray-600 text-sm mb-6">Enter your email to receive a reset link</p>

        {message && (
          <div className={`alert mb-4 ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
            {message}
          </div>
        )}

        {!resetToken ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
              <input
                type="email"
                value={email}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your email"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
            <p className="text-sm text-blue-900 mb-3">
              <strong>Token Generated!</strong> Copy this token to reset your password:
            </p>
            <code className="block bg-white p-2 rounded text-xs text-gray-800 overflow-x-auto border border-gray-300">
              {resetToken}
            </code>
            <p className="text-xs text-blue-700 mt-2">
              Go to Reset Password page and paste this token
            </p>
          </div>
        )}

        <p className="text-center text-gray-700 text-sm mt-4">
          Remember your password? <Link to="/login" className="text-blue-600 hover:underline font-semibold">Log in</Link>
        </p>
        <p className="text-center text-gray-700 text-sm">
          Don't have an account? <Link to="/signup" className="text-blue-600 hover:underline font-semibold">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
