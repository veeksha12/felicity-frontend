import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Edit, Eye, EyeOff, Key, Archive, RotateCcw, Copy, Check } from 'lucide-react';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import AdminPasswordResetManagement from '../components/AdminPasswordResetManagement';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [organizers, setOrganizers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newOrganizerCreds, setNewOrganizerCreds] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();



  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      const response = await adminAPI.getAllOrganizers();
      setOrganizers(response.data);
    } catch (error) {
      console.error('Fetch organizers error:', error);
      toast.error('Failed to load organizers');
    }
  };

  const onCreateOrganizer = async (data) => {
    try {
      setLoading(true);
      setNewOrganizerCreds(null);
      console.log('Creating organizer with data:', data);

      const response = await adminAPI.createOrganizer(data);
      console.log('Create response:', response.data);

      toast.success('Organizer created successfully');
      setNewOrganizerCreds({
        email: response.data.organizer.email,
        password: response.data.organizer.password
      });
      reset();
      setShowForm(false);
      fetchOrganizers(); // Refresh list
    } catch (error) {
      console.error('Create organizer error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to create organizer';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrganizer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await adminAPI.deleteOrganizer(id);
      toast.success('Organizer deleted successfully');
      fetchOrganizers();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete organizer');
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    const action = currentStatus ? 'disable' : 'enable';

    try {
      await adminAPI.manageOrganizer(id, action);
      toast.success(`Organizer ${action}d successfully`);
      fetchOrganizers();
    } catch (error) {
      console.error('Toggle active error:', error);
      toast.error(error.response?.data?.message || `Failed to ${action} organizer`);
    }
  };

  const handleToggleArchive = async (id, isArchived) => {
    const action = isArchived ? 'unarchive' : 'archive';

    try {
      await adminAPI.manageOrganizer(id, action);
      toast.success(`Organizer ${action}d successfully`);
      fetchOrganizers();
    } catch (error) {
      console.error('Toggle archive error:', error);
      toast.error(error.response?.data?.message || `Failed to ${action} organizer`);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-display text-gradient">Admin Dashboard</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-retro py-3 px-6 flex items-center gap-2"
          >
            <Plus size={20} />
            Create Organizer
          </button>
        </div>

        {/* New Organizer Credentials Display */}
        {newOrganizerCreds && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 mb-8 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3 mb-4">
              <Check className="text-green-500" size={24} />
              <h2 className="text-2xl font-display text-green-400">Credentials Generated</h2>
            </div>
            <p className="text-gray-300 mb-6">
              Share these credentials with the organizer. They can log in immediately.
              <span className="block text-sm text-yellow-400 mt-1 italic">
                (This message will disappear if you refresh the page)
              </span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/40 p-4 rounded-lg border border-white/10">
                <p className="text-xs text-gray-500 uppercase mb-1">Email</p>
                <div className="flex items-center justify-between">
                  <code className="text-disco-cyan">{newOrganizerCreds.email}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(newOrganizerCreds.email);
                      toast.success('Email copied');
                    }}
                    className="p-1 hover:text-disco-pink transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              <div className="bg-black/40 p-4 rounded-lg border border-white/10">
                <p className="text-xs text-gray-500 uppercase mb-1">Password</p>
                <div className="flex items-center justify-between">
                  <code className="text-disco-pink">{newOrganizerCreds.password}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(newOrganizerCreds.password);
                      toast.success('Password copied');
                    }}
                    className="p-1 hover:text-disco-pink transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Organizer Form */}
        {showForm && (
          <div className="bg-glass border border-white/10 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-display mb-6">Create New Organizer</h2>
            <form onSubmit={handleSubmit(onCreateOrganizer)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('firstName', { required: 'First name is required' })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                    placeholder="Tech"
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
                    placeholder="Club"
                  />
                  {errors.lastName && (
                    <p className="text-red-400 text-sm mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Email <span className="text-gray-400 text-xs font-normal">(Leave empty to auto-generate)</span>
                </label>
                <input
                  type="email"
                  {...register('email', {
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Invalid email address'
                    }
                  })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                  placeholder="techclub@felicity.iiit.ac.in"
                />
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Password <span className="text-gray-400 text-xs font-normal">(Leave empty to auto-generate)</span>
                </label>
                <input
                  type="password"
                  {...register('password', {
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                  placeholder="Enter or auto-generate password"
                />
                {errors.password && (
                  <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                >
                  <option value="">Select category</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Technical">Technical</option>
                  <option value="Sports">Sports</option>
                  <option value="Other">Other</option>
                </select>
                {errors.category && (
                  <p className="text-red-400 text-sm mt-1">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                  placeholder="Brief description of the organizer"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    reset();
                  }}
                  className="flex-1 px-6 py-3 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-retro py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Organizer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Password Reset Management Section */}
        <div className="mt-8">
          <AdminPasswordResetManagement />
        </div>


        {/* Organizers List */}
        <div className="bg-glass border border-white/10 rounded-2xl p-8">
          <h2 className="text-2xl font-display mb-6">All Organizers</h2>

          {organizers.length > 0 ? (
            <div className="space-y-4">
              {organizers.map((org) => (
                <div
                  key={org._id}
                  className="bg-black/30 border border-white/10 rounded-lg p-6 hover:border-disco-pink/50 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold truncate">
                          {org.firstName} {org.lastName}
                        </h3>
                        {org.category && (
                          <span className="px-3 py-1 bg-disco-purple/20 text-disco-purple text-xs rounded-full">
                            {org.category}
                          </span>
                        )}
                        <span className={`px-3 py-1 text-xs rounded-full ${org.isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                          }`}>
                          {org.isActive ? 'Active' : 'Disabled'}
                        </span>
                        {org.isArchived && (
                          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full flex items-center gap-1">
                            <Archive size={12} />
                            Archived
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-1">{org.email}</p>
                      {org.description && (
                        <p className="text-gray-400 text-sm">{org.description}</p>
                      )}
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleToggleArchive(org._id, org.isArchived)}
                        className={`p-2 rounded-lg transition-colors flex-shrink-0 ${org.isArchived
                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400'
                          : 'bg-glass border border-white/10 hover:bg-white/5 text-gray-400'
                          }`}
                        title={org.isArchived ? 'Unarchive' : 'Archive'}
                      >
                        {org.isArchived ? <RotateCcw size={20} /> : <Archive size={20} />}
                      </button>
                      <button
                        onClick={() => handleToggleActive(org._id, org.isActive)}
                        className={`p-2 rounded-lg transition-colors flex-shrink-0 ${org.isActive
                          ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400'
                          : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                          }`}
                        title={org.isActive ? 'Disable' : 'Enable'}
                      >
                        {org.isActive ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                      <button
                        onClick={() => handleDeleteOrganizer(org._id, `${org.firstName} ${org.lastName}`)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex-shrink-0"
                        title="Delete"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">No organizers created yet</p>
            </div>
          )}
        </div>
      </div>
    </div >
  );
};

export default AdminDashboard;
