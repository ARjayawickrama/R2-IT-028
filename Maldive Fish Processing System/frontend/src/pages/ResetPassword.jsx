import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axiosInstance from '../services/api';

const ResetPassword = () => {
  const [formData, setFormData] = useState({ token: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { token: urlToken } = useParams();

  // Use token from URL params or form input
  const getToken = () => urlToken || formData.token;

  const validateForm = () => {
    const newErrors = {};

    if (!getToken()) {
      newErrors.token = 'Reset token is required';
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
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
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

      setMessage('Password reset successful! Redirecting to dashboard...');
      localStorage.setItem('token', response.data.token);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error resetting password');
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

        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Create New Password</h1>
        <p className="text-center text-gray-600 text-sm mb-6">Enter your reset token and new password</p>

        {message && (
          <div className={`alert mb-4 ${message.includes('Error') || message.includes('successful') ? (message.includes('successful') ? 'alert-success' : 'alert-error') : 'alert-error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!urlToken && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reset Token*</label>
              <textarea
                name="token"
                value={formData.token}
                onChange={handleChange}
                className="input-field h-20 font-mono text-xs resize-none"
                placeholder="Paste the reset token you received"
              />
              {errors.token && <p className="text-red-500 text-sm mt-1">{errors.token}</p>}
            </div>
          )}

          {urlToken && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700">Token found in URL and will be used</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password*</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter new password (6+ characters)"
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password*</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input-field"
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="text-center text-gray-700 text-sm mt-4">
          Back to <Link to="/login" className="text-blue-600 hover:underline font-semibold">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
