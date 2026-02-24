import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { User, Mail, Lock, Eye, EyeOff, Phone, Building } from 'lucide-react';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/useStore';
import toast from 'react-hot-toast';
import ReCAPTCHA from 'react-google-recaptcha';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [participantType, setParticipantType] = useState('Non-IIIT');
  const [captchaToken, setCaptchaToken] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      participantType: 'Non-IIIT',
    },
  });

  const watchEmail = watch('email');

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const response = await authAPI.register({ ...data, captchaToken });

      login(response.data.user, response.data.token);
      toast.success('Registration successful! Welcome to Felicity');

      // Redirect to onboarding for participants, dashboard for others
      if (response.data.user.role === 'Participant') {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 retro-grid opacity-10" />
      <div className="disco-ball absolute top-20 left-10 w-32 h-32 rounded-full opacity-20 animate-float" />
      <div className="disco-ball absolute bottom-20 right-10 w-24 h-24 rounded-full opacity-15 animate-float" style={{ animationDelay: '1s' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-2xl"
      >
        {/* Card */}
        <div className="bg-glass border border-white/10 rounded-2xl p-8 shadow-disco">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="vinyl-record w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Felicity Logo"
                className="w-12 h-12 object-contain"
              />
            </div>
            <h1 className="text-3xl font-display text-gradient mb-2">Join Felicity</h1>
            <p className="text-gray-400">Create your account and start exploring events</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Participant Type Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">Participant Type</label>
              <div className="grid grid-cols-2 gap-4">
                {['IIIT', 'Non-IIIT'].map((type) => (
                  <label
                    key={type}
                    className={`relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${participantType === type
                      ? 'border-disco-pink bg-disco-pink/10'
                      : 'border-white/10 hover:border-white/30'
                      }`}
                  >
                    <input
                      type="radio"
                      value={type}
                      {...register('participantType', { required: true })}
                      onChange={(e) => setParticipantType(e.target.value)}
                      className="sr-only"
                    />
                    <span className="font-medium">{type}</span>
                    {participantType === type && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-disco-pink rounded-full" />
                    )}
                  </label>
                ))}
              </div>
              {participantType === 'IIIT' && (
                <p className="mt-2 text-sm text-disco-pink">
                  Please use your IIIT email (@students.iiit.ac.in or @research.iiit.ac.in)
                </p>
              )}
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <div className="relative">
                  <User
                    className="absolute left-1 top-1 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    {...register('firstName', { required: 'First name is required' })}
                    className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink transition-colors"
                    placeholder="John"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-400">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <div className="relative">
                  <User
                    className="absolute left-1 top-1 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    {...register('lastName', { required: 'Last name is required' })}
                    className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink transition-colors"
                    placeholder="Doe"
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-400">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
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
                      value: participantType === 'IIIT'
                        ? /@(students|research)\.iiit\.ac\.in$/
                        : /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: participantType === 'IIIT'
                        ? 'Please use your IIIT email'
                        : 'Invalid email address',
                    },
                  })}
                  className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink transition-colors"
                  placeholder={participantType === 'IIIT' ? 'your.name@students.iiit.ac.in' : 'your.email@example.com'}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Contact Number <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-1 top-1 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="tel"
                  {...register('contactNumber', {
                    required: 'Contact number is required',
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Contact number must be exactly 10 digits',
                    },
                  })}
                  className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink transition-colors"
                  placeholder="9876543210"
                  maxLength={10}
                />
              </div>
              {errors.contactNumber && (
                <p className="mt-1 text-sm text-red-400">{errors.contactNumber.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">Enter 10-digit mobile number</p>
            </div>

            {/* College/Organization Name (only for Non-IIIT) */}
            {participantType === 'Non-IIIT' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  College / Organization Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Building
                    className="absolute left-1 top-1 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    {...register('collegeName', {
                      required: participantType === 'Non-IIIT' ? 'College/Organization name is required' : false,
                    })}
                    className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink transition-colors"
                    placeholder="Your college or organization name"
                  />
                </div>
                {errors.collegeName && (
                  <p className="mt-1 text-sm text-red-400">{errors.collegeName.message}</p>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock
                  className="absolute left-1 top-1 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  className="w-full pl-12 pr-12 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !captchaToken}
              className="w-full btn-retro py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="spinner" />
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-disco-pink hover:text-disco-purple transition-colors">
                Login here
              </Link>
            </p>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default Register;