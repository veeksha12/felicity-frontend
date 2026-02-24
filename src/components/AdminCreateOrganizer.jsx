import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Building2, FileText, Lock, MessageSquare } from 'lucide-react';
import axios from 'axios';

const AdminCreateOrganizer = ({ onSuccess }) => {
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      category: '',
      description: '',
      contactEmail: '',
      discordWebhook: ''
    }
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/admin/create-organizer', data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage({
        type: 'success',
        text: `Organizer "${data.firstName}" created successfully!`
      });

      reset();

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(response.data.organizer);
      }

      // Clear success message after 5 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    } catch (error) {
      console.error('Error creating organizer:', error);

      const errorMessage = error.response?.data?.message ||
        error.response?.data?.errors?.join(', ') ||
        'Failed to create organizer';

      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Organizer</h2>

      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg ${message.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
            }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Required Fields Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">
            Required Information
          </h3>

          {/* Organizer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organizer Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                {...register('firstName', {
                  required: 'Organizer name is required',
                  minLength: {
                    value: 2,
                    message: 'Name must be at least 2 characters'
                  }
                })}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="E.g., Programming Club, Student Council"
              />
            </div>
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          {/* Last Name (Optional but recommended) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name (Optional)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                {...register('lastName')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional identifier"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <select
                {...register('category', {
                  required: 'Category is required'
                })}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
              >
                <option value="">Select category</option>
                <option value="Club">Club</option>
                <option value="Council">Council</option>
                <option value="Team">Team</option>
              </select>
            </div>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Club: Student clubs (e.g., Programming, Art) | Council: Governing bodies | Team: Sports/Competition teams
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                {...register('description', {
                  required: 'Description is required',
                  minLength: {
                    value: 20,
                    message: 'Description must be at least 20 characters'
                  },
                  maxLength: {
                    value: 500,
                    message: 'Description must not exceed 500 characters'
                  }
                })}
                rows={4}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Describe the organization, its activities, mission, and what participants can expect..."
              />
            </div>
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">20-500 characters. Be descriptive and engaging!</p>
          </div>

          {/* Contact Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                {...register('contactEmail', {
                  required: 'Contact email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Please enter a valid email address'
                  }
                })}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.contactEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="contact@organization.com"
              />
            </div>
            {errors.contactEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.contactEmail.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Public email for participants to reach out. This will be displayed on the platform.
            </p>
          </div>
        </div>

        {/* Account Credentials Section */}
        <div className="space-y-6 pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-700">Account Credentials</h3>

          {/* Login Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Login Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                {...register('email', {
                  required: 'Login email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Please enter a valid email address'
                  }
                })}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="admin@organization.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Used for logging into the platform. Can be different from contact email.
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Enter secure password"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">Minimum 6 characters</p>
          </div>
        </div>

        {/* Optional Features Section */}
        <div className="space-y-6 pt-6 border-t">
          <h3 className="text-lg font-semibold text-gray-700">Optional Features</h3>

          {/* Discord Webhook */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discord Webhook URL (Optional)
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="url"
                {...register('discordWebhook', {
                  pattern: {
                    value: /^https:\/\/discord\.com\/api\/webhooks\/.+$/,
                    message: 'Must be a valid Discord webhook URL (https://discord.com/api/webhooks/...)'
                  }
                })}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.discordWebhook ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="https://discord.com/api/webhooks/..."
              />
            </div>
            {errors.discordWebhook && (
              <p className="mt-1 text-sm text-red-600">{errors.discordWebhook.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Receive Discord notifications for new event registrations and updates
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
          >
            {isSubmitting ? 'Creating Organizer...' : 'Create Organizer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminCreateOrganizer;