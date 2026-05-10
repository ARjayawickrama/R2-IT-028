import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GuidelinesPage from './MechanicalSaltOptimization/GuidelinesPage';

// Custom CSS for animations
const customStyles = `
  @keyframes float {
    0%, 100% {
      transform: translateY(0px) translateX(0px);
      opacity: 0.3;
    }
    25% {
      transform: translateY(-20px) translateX(10px);
      opacity: 0.6;
    }
    50% {
      transform: translateY(-10px) translateX(-10px);
      opacity: 0.4;
    }
    75% {
      transform: translateY(-30px) translateX(5px);
      opacity: 0.7;
    }
  }
  
  @keyframes swim {
    0%, 100% {
      transform: translateX(0px) translateY(0px) rotate(0deg);
    }
    25% {
      transform: translateX(30px) translateY(-15px) rotate(5deg);
    }
    50% {
      transform: translateX(-20px) translateY(-25px) rotate(-3deg);
    }
    75% {
      transform: translateX(40px) translateY(-10px) rotate(7deg);
    }
  }
  
  .animate-swim {
    animation: swim 15s ease-in-out infinite;
  }
`;

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showGuidelines, setShowGuidelines] = useState(false);
  const { login, error: authError, loading } = useAuth();
  const navigate = useNavigate();

  // Auto-open GuidelinesPage when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGuidelines(true);
    }, 1000); // Open after 1 second

    return () => clearTimeout(timer);
  }, []);

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
      <style>{customStyles}</style>
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
          
          <div className="ml-auto flex items-center gap-2">
            <button className="px-2 py-1 hover:bg-gray-700 rounded text-xs">⚙️ Settings</button>
            <button className="px-2 py-1 hover:bg-gray-700 rounded text-xs">🔔 Notifications</button>
            <button className="px-2 py-1 hover:bg-gray-700 rounded text-xs">👤 Admin</button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex bg-gray-100 min-h-screen relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          {/* Floating Bubbles */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-cyan-200 rounded-full opacity-15 animate-bounce"></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-teal-200 rounded-full opacity-10 animate-pulse"></div>
          <div className="absolute top-1/3 right-1/3 w-28 h-28 bg-blue-300 rounded-full opacity-20 animate-bounce"></div>
          
          {/* Floating Fish Icons */}
          <div className="absolute top-10 left-1/2 text-6xl text-blue-300 opacity-30 animate-swim">🐟</div>
          <div className="absolute top-1/4 right-10 text-4xl text-cyan-300 opacity-25 animate-swim" style={{ animationDelay: '2s' }}>🐠</div>
          <div className="absolute bottom-1/3 left-20 text-5xl text-teal-300 opacity-20 animate-swim" style={{ animationDelay: '4s' }}>🐡</div>
          <div className="absolute top-1/2 left-10 text-3xl text-blue-200 opacity-30 animate-swim" style={{ animationDelay: '6s' }}>🦈</div>
          
          {/* Wave Animation */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-100 to-transparent opacity-50">
            <svg className="absolute bottom-0 w-full h-16" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
                    fill="rgba(59, 130, 246, 0.1)" 
                    className="animate-pulse">
                <animate attributeName="d" 
                  values="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z;
                          M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z;
                          M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                  dur="8s" 
                  repeatCount="indefinite"/>
              </path>
            </svg>
          </div>
          
          {/* Particle Effects */}
          <div className="absolute top-0 left-0 w-full h-full">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
                  animationDelay: `${Math.random() * 5}s`
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* Login Form Container */}
        <div className="flex-1 flex items-center justify-center p-8 relative z-10">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-200">
            {/* Login Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-xl">
              <div className="flex justify-center mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-white/30 rounded-full animate-pulse"></div>
                  <div className="w-4 h-4 bg-white/30 rounded-full animate-pulse delay-75"></div>
                  <div className="w-4 h-4 bg-white/30 rounded-full animate-pulse delay-150"></div>
                  <div className="w-4 h-4 bg-white/30 rounded-full animate-pulse delay-300"></div>
                 <div className="flex items-center">

</div>
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

      {/* Footer */}
      <footer className="bg-gray-800 text-white border-t border-gray-700">
        <div className="px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-blue-800 font-bold text-sm">MF</span>
                </div>
                <h3 className="font-semibold">Maldive Fish</h3>
              </div>
              <p className="text-gray-300 text-sm">Leading fish processing automation system for the Maldives fishing industry.</p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Dashboard</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Processing</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Quality Control</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Reports</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Contact Support</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">System Status</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <span>📧</span>
                  <span>support@maldivefish.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📞</span>
                  <span>+960 123-4567</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span>Srilanaka Maldive Fish </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 mt-6 pt-4">
            <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
              <div>© 2026 Maldive Fish Processing System. All rights reserved.</div>
              <div className="flex gap-4 mt-2 md:mt-0">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Auto-open GuidelinesPage Modal */}
      {showGuidelines && (
        <GuidelinesPage 
          onClose={() => setShowGuidelines(false)}
          onFinish={() => setShowGuidelines(false)}
        />
      )}
    </>
  );
};

export default Login;
