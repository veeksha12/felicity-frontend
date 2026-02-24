import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, DollarSign, CheckCircle, Clock, Search, Filter } from 'lucide-react';
import { eventsAPI, registrationsAPI } from '../services/api';
import { formatDate, formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

const PaymentManagement = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [eventRes, participantsRes] = await Promise.all([
                eventsAPI.getById(id),
                eventsAPI.getParticipants(id)
            ]);
            setEvent(eventRes.data);
            setParticipants(participantsRes.data.participants || []);
        } catch (error) {
            console.error('Load error:', error);
            toast.error('Failed to load data');
            navigate('/organizer');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsPaid = async (registrationId) => {
        try {
            setUpdatingId(registrationId);
            await registrationsAPI.updatePaymentStatus(registrationId, 'Completed');
            toast.success('Payment marked as completed');

            // Update local state
            setParticipants(prev => prev.map(p =>
                p._id === registrationId ? { ...p, paymentStatus: 'Completed' } : p
            ));
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Failed to update payment status');
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredParticipants = participants.filter(p => {
        const matchesSearch =
            p.participant.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.participant.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.participant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.ticketId.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter = filterStatus === 'all' || p.paymentStatus.toLowerCase() === filterStatus.toLowerCase();

        return matchesSearch && matchesFilter;
    });

    const stats = {
        total: participants.length,
        paid: participants.filter(p => p.paymentStatus === 'Completed').length,
        pending: participants.filter(p => p.paymentStatus === 'Pending').length,
        revenue: participants.filter(p => p.paymentStatus === 'Completed').length * (event?.registrationFee || 0)
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12">
            <div className="container mx-auto px-4">
                <button
                    onClick={() => navigate('/organizer')}
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>

                <div className="mb-8">
                    <h1 className="text-4xl font-display text-gradient mb-2">{event?.eventName} - Payments</h1>
                    <p className="text-gray-400">Manage payment status for registered participants</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-glass border border-white/10 rounded-xl p-6">
                        <p className="text-gray-400 text-sm mb-1">Total Registrations</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                        <p className="text-green-400 text-sm mb-1">Paid</p>
                        <p className="text-2xl font-bold text-green-400">{stats.paid}</p>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
                        <p className="text-yellow-400 text-sm mb-1">Pending</p>
                        <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                    </div>
                    <div className="bg-disco-pink/10 border border-disco-pink/20 rounded-xl p-6">
                        <p className="text-disco-pink text-sm mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold text-disco-pink">{formatCurrency(stats.revenue)}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-glass border border-white/10 rounded-lg p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-1 top-1 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by name, email, or ticket ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                            >
                                <option value="all">All Payments</option>
                                <option value="completed">Paid</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-glass border border-white/10 rounded-lg overflow-hidden">
                    <div className="table-responsive">
                        <table className="w-full">
                            <thead className="bg-black/30">
                                <tr>
                                    <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">Participant</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">Ticket ID</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {filteredParticipants.map((p) => (
                                    <tr key={p._id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium">{p.participant.firstName} {p.participant.lastName}</p>
                                                <p className="text-sm text-gray-400">{p.participant.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-disco-pink">{p.ticketId}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${p.paymentStatus === 'Completed' ? 'bg-green-500/20 text-green-400' :
                                                p.paymentStatus === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-red-500/20 text-red-400'
                                                }`}>
                                                {p.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {p.paymentStatus === 'Pending' && (
                                                <button
                                                    onClick={() => handleMarkAsPaid(p._id)}
                                                    disabled={updatingId === p._id}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm transition-colors disabled:opacity-50"
                                                >
                                                    <CheckCircle size={16} />
                                                    {updatingId === p._id ? 'Updating...' : 'Mark as Paid'}
                                                </button>
                                            )}
                                            {p.paymentStatus === 'Completed' && (
                                                <span className="text-gray-500 text-sm flex items-center gap-2">
                                                    <CheckCircle size={16} className="text-green-500" />
                                                    Paid
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filteredParticipants.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-10 text-center text-gray-400">
                                            No participants found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentManagement;
