import { useState, useEffect } from 'react';
import { Lock, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import toast from 'react-hot-toast';

const PasswordResetRequest = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (user?.role === 'Organizer') {
      loadRequests();
    }
  }, [user]);

  const loadRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/password-reset/my-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load requests');

      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Load requests error:', error);
      toast.error('Failed to load password reset requests');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (reason.trim().length < 10) {
      toast.error('Please provide a detailed reason (minimum 10 characters)');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/password-reset/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: reason.trim() })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const data = await response.json();
      toast.success(data.message);
      setReason('');
      setShowForm(false);
      loadRequests();
    } catch (error) {
      console.error('Submit request error:', error);
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      Pending: { color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
      Approved: { color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
      Rejected: { color: 'bg-red-500/20 text-red-400', icon: XCircle },
    };
    
    const badge = badges[status] || badges.Pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${badge.color}`}>
        <Icon size={14} />
        {status}
      </span>
    );
  };

  // Check if there's a pending request
  const hasPendingRequest = requests.some(r => r.status === 'Pending');

  return (
    <div className="bg-glass border border-white/10 rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <Lock className="text-disco-pink" size={24} />
        <h2 className="text-2xl font-display">Password Reset</h2>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-400 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm">
            <p className="text-blue-400 font-medium mb-1">How it works:</p>
            <ol className="text-gray-300 space-y-1 list-decimal list-inside">
              <li>Submit a password reset request with a reason</li>
              <li>Admin will review your request</li>
              <li>If approved, admin will share your new credentials</li>
              <li>Contact admin directly to get your new password</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Request Form */}
      {!showForm && !hasPendingRequest && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full btn-retro py-4 mb-6"
        >
          Request Password Reset
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="bg-black/30 rounded-lg p-6">
            <label className="block text-sm font-medium mb-3">
              Reason for Password Reset <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink mb-4"
              placeholder="Please explain why you need a password reset (minimum 10 characters)..."
              required
              minLength={10}
            />
            <p className="text-xs text-gray-400 mb-4">
              {reason.length}/10 characters minimum
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setReason('');
                }}
                className="flex-1 px-6 py-3 border border-white/20 rounded-lg hover:bg-white/10 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || reason.trim().length < 10}
                className="flex-1 btn-retro py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Request History */}
      <div>
        <h3 className="font-medium mb-4">Request History</h3>
        {requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((request) => (
              <div
                key={request._id}
                className="bg-black/30 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-1">
                      Submitted {new Date(request.submittedAt).toLocaleDateString()}
                    </p>
                    {getStatusBadge(request.status)}
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm font-medium mb-1">Your Reason:</p>
                  <p className="text-sm text-gray-300 bg-black/30 rounded p-3">
                    "{request.reason}"
                  </p>
                </div>

                {request.reviewedAt && (
                  <div className="border-t border-white/10 pt-3">
                    <p className="text-sm text-gray-400 mb-2">
                      Reviewed {new Date(request.reviewedAt).toLocaleDateString()}
                      {request.reviewedBy && ` by ${request.reviewedBy.name}`}
                    </p>
                    
                    {request.adminComments && (
                      <div className="bg-black/30 rounded p-3">
                        <p className="text-sm font-medium mb-1">Admin Comments:</p>
                        <p className="text-sm text-gray-300">"{request.adminComments}"</p>
                      </div>
                    )}

                    {request.status === 'Approved' && (
                      <div className="mt-3 bg-green-500/10 border border-green-500/30 rounded p-3">
                        <p className="text-sm text-green-400">
                          ✓ Your password has been reset. Please contact the admin to get your new credentials.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {request.status === 'Pending' && (
                  <div className="mt-3 bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                    <p className="text-sm text-yellow-400">
                      ⏳ Your request is pending review by admin. Please wait for approval.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Lock className="mx-auto mb-3 text-gray-600" size={40} />
            <p className="text-gray-400 text-sm">No password reset requests yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordResetRequest;