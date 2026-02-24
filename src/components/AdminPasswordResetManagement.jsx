import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, Clock, Search, Filter, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { passwordResetAPI } from '../services/api';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/helpers';

const AdminPasswordResetManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('Pending'); // Pending, Approved, Rejected, All
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [action, setAction] = useState(null); // 'approve' or 'reject'
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);

  // New Password Display Modal
  const [newCredentials, setNewCredentials] = useState(null);

  useEffect(() => {
    loadRequests();
  }, [filterStatus]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'All' ? { status: filterStatus } : {};
      const response = await passwordResetAPI.getAllRequests(params);
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Failed to load password requests');
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (request, actionType) => {
    setSelectedRequest(request);
    setAction(actionType);
    setComments('');
  };

  const handleSubmitAction = async () => {
    try {
      setProcessing(true);
      const response = await passwordResetAPI.reviewRequest({
        requestId: selectedRequest._id,
        action,
        comments
      });

      if (action === 'approve') {
        setNewCredentials(response.data.credentials);
      }

      toast.success(`Request ${action}ed successfully`);
      setSelectedRequest(null);
      setAction(null);
      loadRequests();
    } catch (error) {
      console.error('Review error:', error);
      toast.error(error.response?.data?.message || `Failed to ${action} request`);
    } finally {
      setProcessing(false);
    }
  };

  const handleMarkViewed = async () => {
    try {
      // If we have credentials, we need to mark them as viewed/cleared on backend
      // Note: The backend endpoint typically handles clearing the password from DB
      // We'll assume the user has copied it.
      setNewCredentials(null);
      loadRequests(); // Refresh to update status if needed
    } catch (error) {
      console.error('Error closing credentials:', error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="flex items-center gap-1 text-green-400 bg-green-500/10 px-2 py-1 rounded text-xs"><CheckCircle size={12} /> Approved</span>;
      case 'Rejected':
        return <span className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-1 rounded text-xs"><XCircle size={12} /> Rejected</span>;
      default:
        return <span className="flex items-center gap-1 text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded text-xs"><Clock size={12} /> Pending</span>;
    }
  };

  return (
    <div className="bg-glass border border-white/10 rounded-2xl p-8 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-display">Password Reset Requests</h2>
        <div className="flex gap-2">
          {['Pending', 'Approved', 'Rejected', 'All'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterStatus === status
                ? 'bg-disco-purple text-white'
                : 'bg-white/5 hover:bg-white/10 text-gray-300'
                }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-disco-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Organizer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {requests.map((req) => (
                <tr key={req._id} className="hover:bg-white/5">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="font-medium text-white">{req.organizer.name}</p>
                      <p className="text-xs text-gray-400">{req.organizer.email}</p>
                      <p className="text-xs text-disco-purple">{req.organizer.category}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-300 line-clamp-2" title={req.reason}>
                      {req.reason}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {formatDate(req.submittedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(req.status)}
                    {req.reviewedBy && (
                      <p className="text-xs text-gray-500 mt-1">by {req.reviewedBy.name}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {req.status === 'Pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openActionModal(req, 'approve')}
                          className="p-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-colors"
                          title="Approve"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => openActionModal(req, 'reject')}
                          className="p-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                          title="Reject"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    )}
                    {/* Display newly generated password if relevant and not viewed yet (handled via modal usually) */}
                    {req.newPassword && (
                      <button
                        onClick={() => setNewCredentials({ email: req.organizer.email, newPassword: req.newPassword })}
                        className="text-xs bg-disco-cyan/20 text-disco-cyan px-2 py-1 rounded"
                      >
                        View Password
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-black/20 rounded-lg">
          <p className="text-gray-400">No {filterStatus.toLowerCase()} requests found</p>
        </div>
      )}

      {/* Action Modal */}
      {selectedRequest && !newCredentials && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-2xl relative z-[10000]">
            <h3 className="text-xl font-bold text-white mb-2 capitalize">
              {action} Request
            </h3>
            <p className="text-gray-400 mb-6">
              You are about to {action} the password reset request for <span className="text-white">{selectedRequest.organizer.name}</span>.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Comments (Optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add a note..."
                className="w-full h-24 px-4 py-3 bg-black/50 border border-white/20 rounded-lg focus:outline-none focus:border-disco-pink text-sm resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setSelectedRequest(null); setAction(null); }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAction}
                disabled={processing}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${action === 'approve'
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  }`}
              >
                {processing ? 'Processing...' : `Confirm ${action.charAt(0).toUpperCase() + action.slice(1)}`}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Credentials Modal */}
      {newCredentials && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-900 border border-disco-pink/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden z-[10000]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-disco-purple to-disco-pink"></div>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <h3 className="text-2xl font-display text-white mb-2">Password Reset Approved</h3>
              <p className="text-gray-400 text-sm">
                A new password has been generated. Please copy and share it with the organizer securely.
              </p>
            </div>

            <div className="bg-black/50 border border-white/10 rounded-xl p-4 mb-6">
              <div className="mb-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
                <p className="font-mono text-gray-300">{newCredentials.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">New Password</p>
                <div className="flex items-center justify-between bg-white/5 rounded px-3 py-2">
                  <p className="font-mono text-disco-pink text-lg tracking-wide">{newCredentials.newPassword}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-6 flex gap-3">
              <AlertCircle className="text-yellow-500 flex-shrink-0" size={20} />
              <p className="text-xs text-yellow-200">
                This password is only shown once. Make sure to copy it before closing this window.
              </p>
            </div>

            <button
              onClick={handleMarkViewed}
              className="w-full btn-retro py-3"
            >
              I have copied the password
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminPasswordResetManagement;