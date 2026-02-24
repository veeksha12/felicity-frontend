import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/useStore';
import toast from 'react-hot-toast';
import ReCAPTCHA from 'react-google-recaptcha';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    console.log(' Login attempt with:', { email: data.email }); // Debug

    try {
      setLoading(true);
      console.log(' Calling API...'); // Debug

      const response = await authAPI.login({ ...data, captchaToken });
      console.log(' Login successful:', response.data); // Debug

      login(response.data.user, response.data.token);
      toast.success('Welcome back!');

      // Redirect based on role
      const { role } = response.data.user;
      if (role === 'Organizer') {
        navigate('/organizer');
      } else if (role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error(' Login error:', error); // Debug
      console.error('Error response:', error.response); // Debug

      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 retro-grid opacity-10" />
      <div className="disco-ball absolute top-20 right-10 w-32 h-32 rounded-full opacity-20" />
      <div className="disco-ball absolute bottom-20 left-10 w-24 h-24 rounded-full opacity-15" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-glass border border-white/10 rounded-2xl p-8 shadow-disco">
          <div className="text-center mb-8">
            <div className="vinyl-record w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Felicity Logo"
                className="w-12 h-12 object-contain"
              />
            </div>
            <h1 className="text-3xl font-display text-gradient mb-2">Welcome Back</h1>
            <p className="text-gray-400">Login to your Felicity account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail
                  className="absolute left-1 top-1 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Invalid email address',
                    },
                  })}
                  className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink transition-colors"
                  placeholder="your.email@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative group">
                {/* Left Icon (Lock) */}
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock
                    className="text-gray-400 group-focus-within:text-disco-pink transition-colors"
                    size={20}
                  />
                </div>

                {/* Input Field - Balanced Padding */}
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                  })}
                  className="w-full pl-10 pr-10 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink transition-colors placeholder:text-gray-600"
                  placeholder="••••••••"
                />

                {/* Right Icon (Eye Button) - Symmetrical to the Lock */}
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-white focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* CAPTCHA */}
            <div className="flex justify-center">
              <ReCAPTCHA
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={(token) => setCaptchaToken(token)}
                theme="dark"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !captchaToken}
              className="w-full btn-retro py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Logging in...
                </span>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-disco-pink hover:text-disco-purple transition-colors">
                Register here
              </Link>
            </p>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default Login;
