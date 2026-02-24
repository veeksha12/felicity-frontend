import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Key, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { passwordResetAPI } from '../services/api';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/helpers';

const PasswordResetRequest = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            const response = await passwordResetAPI.getMyRequests();
            setRequests(response.data.requests || []);
        } catch (error) {
            console.error('Error loading requests:', error);
            toast.error('Failed to load request history');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (reason.trim().length < 10) {
            toast.error('Please provide a detailed reason (at least 10 characters)');
            return;
        }

        // Check if there's already a pending request
        const pendingRequest = requests.find(r => r.status === 'Pending');
        if (pendingRequest) {
            toast.error('You already have a pending request');
            return;
        }

        try {
            setSubmitting(true);
            await passwordResetAPI.requestReset({ reason });
            toast.success('Request submitted successfully');
            setReason('');
            loadRequests();
        } catch (error) {
            console.error('Submit error:', error);
            toast.error(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setSubmitting(false);
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
        <div className="min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <button
                    onClick={() => navigate('/organizer')}
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Request Form */}
                    <div className="md:col-span-1">
                        <div className="bg-glass border border-white/10 rounded-2xl p-6 sticky top-24">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-disco-purple/20 rounded-lg">
                                    <Key className="text-disco-purple" size={24} />
                                </div>
                                <h2 className="text-xl font-display">Request Reset</h2>
                            </div>

                            <p className="text-sm text-gray-400 mb-6">
                                If you need to reset your password, please submit a request to the administrator.
                                You will receive your new password securely once approved.
                            </p>

                            <form onSubmit={handleSubmit}>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Reason for Reset
                                    </label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="e.g., Forgot password, security concern..."
                                        className="w-full h-32 px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink text-sm resize-none"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1 text-right">
                                        {reason.length}/10 characters min
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting || requests.some(r => r.status === 'Pending')}
                                    className="w-full btn-retro py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Request History */}
                    <div className="md:col-span-2">
                        <h2 className="text-2xl font-display text-gradient mb-6">Request History</h2>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <div className="w-8 h-8 border-2 border-disco-cyan border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : requests.length > 0 ? (
                            <div className="space-y-4">
                                {requests.map((req) => (
                                    <div key={req._id} className="bg-glass border border-white/10 rounded-xl p-5 hover:bg-white/5 transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    {getStatusBadge(req.status)}
                                                    <span className="text-xs text-gray-500">
                                                        {formatDate(req.submittedAt)}
                                                    </span>
                                                </div>
                                                <p className="text-gray-300 text-sm mt-2">{req.reason}</p>
                                            </div>
                                        </div>

                                        {req.status !== 'Pending' && req.adminComments && (
                                            <div className="mt-4 pt-3 border-t border-white/5 bg-black/20 -mx-5 -mb-5 p-4 rounded-b-xl">
                                                <div className="flex items-start gap-2">
                                                    <AlertCircle size={16} className="text-gray-400 mt-0.5" />
                                                    <div>
                                                        <p className="text-xs font-medium text-gray-400 mb-1">Admin Response</p>
                                                        <p className="text-sm text-gray-300">{req.adminComments}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-glass border border-white/10 rounded-2xl p-12 text-center">
                                <Clock className="mx-auto mb-4 text-gray-600" size={48} />
                                <p className="text-gray-400">No password reset requests found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PasswordResetRequest;
