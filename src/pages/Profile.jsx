import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone, Building, Lock, Check, Link as LinkIcon } from 'lucide-react';
import { usersAPI } from '../services/api';
import { useAuthStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PasswordResetRequest from '../components/PasswordResetRequest';
import PreferencesEditor from '../components/PreferencesEditor';

const Profile = () => {
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      contactNumber: user?.contactNumber || '',
      collegeName: user?.collegeName || '',
      category: user?.category || '',
      description: user?.description || '',
      discordWebhook: user?.discordWebhook || '',
    }
  });

  useEffect(() => {
    // Reset form when user data changes
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        contactNumber: user.contactNumber || '',
        collegeName: user.collegeName || '',
        category: user.category || '',
        description: user.description || '',
        discordWebhook: user.discordWebhook || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      console.log('Submitting profile update:', data);

      const endpoint = user.role === 'Participant'
        ? usersAPI.updateParticipantProfile
        : usersAPI.updateOrganizerProfile;

      const response = await endpoint(data);
      console.log('Profile update response:', response.data);

      updateUser(response.data);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('New password cannot be current password');
      return;
    }

    try {
      setLoading(true);
      const response = await usersAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      // Check if backend indicates success
      if (response.data.success) {
        toast.success('Password changed successfully! Logging you out...');

        // Clear password fields
        setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        setShowPasswordForm(false);

        // Clear storage immediately to prevent stale state issues
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Logout user and redirect to login
        setTimeout(() => {
          logout();
          navigate('/login', { replace: true });
        }, 2000);
      } else {
        toast.error('Password change failed');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-4xl font-display text-gradient mb-8">Profile Settings</h1>

        {/* Profile Information */}
        <div className="bg-glass border border-white/10 rounded-2xl p-8 mb-6">
          <h2 className="text-2xl font-display mb-6">Profile Information</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  First Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  {...register('firstName', { required: 'First name is required' })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                />
                {errors.firstName && (
                  <p className="text-red-400 text-sm mt-1">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Last Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  {...register('lastName', { required: 'Last name is required' })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                />
                {errors.lastName && (
                  <p className="text-red-400 text-sm mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-1 top-1 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg opacity-50 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Contact Number {user?.role === 'Participant' && <span className="text-red-400">*</span>}
              </label>
              <div className="relative">
                <Phone className="absolute left-1 top-1 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  {...register('contactNumber', {
                    required: user?.role === 'Participant' ? 'Contact number is required' : false,
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Contact number must be exactly 10 digits'
                    }
                  })}
                  className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                  placeholder="9876543210"
                  maxLength={10}
                />
              </div>
              {errors.contactNumber && (
                <p className="text-red-400 text-sm mt-1">{errors.contactNumber.message}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">Enter 10-digit mobile number</p>
            </div>

            {/* Participant-specific fields */}
            {user?.role === 'Participant' && user?.participantType === 'Non-IIIT' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  College/Organization <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Building className="absolute left-1 top-1 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    {...register('collegeName', {
                      required: user?.participantType === 'Non-IIIT' ? 'College/Organization name is required' : false
                    })}
                    className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                    placeholder="Your college or organization name"
                  />
                </div>
                {errors.collegeName && (
                  <p className="text-red-400 text-sm mt-1">{errors.collegeName.message}</p>
                )}
              </div>
            )}

            {/* Participant Type Display (Read-only for participants) */}
            {user?.role === 'Participant' && (
              <div>
                <label className="block text-sm font-medium mb-2">Participant Type</label>
                <div className="px-4 py-3 bg-black/30 border border-white/10 rounded-lg opacity-70">
                  <span className="text-white">{user.participantType}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Participant type cannot be changed</p>
              </div>
            )}

            {/* Organizer-specific fields */}
            {user?.role === 'Organizer' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    {...register('category')}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                  >
                    <option value="">Select category</option>
                    <option value="Club">Club</option>
                    <option value="Council">Council</option>
                    <option value="Team">Team</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                    placeholder="Describe your organization"
                  />
                </div>

                {/* Discord Webhook URL */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Discord Webhook URL
                    <span className="text-gray-400 text-xs ml-2">(optional)</span>
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-1 top-1 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="url"
                      {...register('discordWebhook', {
                        pattern: {
                          value: /^https:\/\/discord\.com\/api\/webhooks\/.+$/,
                          message: 'Must be a valid Discord webhook URL'
                        }
                      })}
                      className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                      placeholder="https://discord.com/api/webhooks/..."
                    />
                  </div>
                  {errors.discordWebhook && (
                    <p className="text-red-400 text-sm mt-1">{errors.discordWebhook.message}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Events will be automatically posted to your Discord server when published
                  </p>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isDirty}
              className="w-full btn-retro py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={20} />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>

        {/* Preferences Section - Participants Only */}
        {user?.role === 'Participant' && (
          <PreferencesEditor />
        )}

        {/* Password Change Section - Participants Only */}
        {user?.role === 'Participant' && (
          <div className="bg-glass border border-white/10 rounded-2xl p-8 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display">Change Password</h2>
              {!showPasswordForm && (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="px-4 py-2 bg-disco-pink/20 hover:bg-disco-pink/30 text-disco-pink rounded-lg transition-colors"
                >
                  Change Password
                </button>
              )}
            </div>

            {showPasswordForm && (
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-1 top-1 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                      placeholder="Enter current password"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-1 top-1 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                      placeholder="Enter new password (min 6 characters)"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-1 top-1 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="password"
                      value={passwordData.confirmNewPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                      placeholder="Confirm your new password"
                      required
                    />
                  </div>
                  {passwordData.newPassword && passwordData.confirmNewPassword && passwordData.newPassword !== passwordData.confirmNewPassword && (
                    <p className="text-red-400 text-sm mt-1">Passwords do not match</p>
                  )}
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-sm text-yellow-400">
                    ⚠️ You will be logged out after changing your password and need to login again with your new password.
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
                    }}
                    className="flex-1 px-6 py-3 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn-retro py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {user?.role === 'Organizer' && (
          <PasswordResetRequest />
        )}
      </div>
    </div>
  );
};

export default Profile;