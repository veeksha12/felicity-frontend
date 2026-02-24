import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Search, Users, Mail, Phone, CheckCircle, XCircle, MoreVertical, Edit2 } from 'lucide-react';
import { eventsAPI, attendanceAPI } from '../services/api'; // Added attendanceAPI
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const EventParticipants = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Manual Override State
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [overrideAction, setOverrideAction] = useState('mark'); // 'mark' or 'unmark'
  const [overrideReason, setOverrideReason] = useState('');
  const [processingOverride, setProcessingOverride] = useState(false);

  useEffect(() => {
    loadEventData();
  }, [id]);

  const loadEventData = async () => {
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
      toast.error('Failed to load participants');
      navigate('/organizer');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await eventsAPI.exportParticipants(id);

      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${event.eventName}_participants_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Participants exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export participants');
    }
  };

  const openOverrideModal = (registration, action) => {
    setSelectedRegistration(registration);
    setOverrideAction(action);
    setOverrideReason('');
    setOverrideModalOpen(true);
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      toast.error('Please provide a reason for this manual action');
      return;
    }

    try {
      setProcessingOverride(true);
      const response = await attendanceAPI.manualOverride({
        registrationId: selectedRegistration._id,
        eventId: id,
        action: overrideAction,
        reason: overrideReason
      });

      toast.success(response.data.message);

      // Update local state
      setParticipants(prev => prev.map(p => {
        if (p._id === selectedRegistration._id) {
          return {
            ...p,
            attendanceMarked: overrideAction === 'mark',
            attendanceTime: overrideAction === 'mark' ? new Date() : null,
            status: overrideAction === 'mark' ? 'Attended' : 'Confirmed'
          };
        }
        return p;
      }));

      setOverrideModalOpen(false);
    } catch (error) {
      console.error('Override error:', error);
      toast.error(error.response?.data?.message || 'Failed to update attendance');
    } finally {
      setProcessingOverride(false);
    }
  };

  const filteredParticipants = participants.filter(reg => {
    const matchesSearch =
      reg.participant.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.participant.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.participant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.ticketId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      reg.status.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: participants.length,
    confirmed: participants.filter(r => r.status === 'Confirmed').length,
    attended: participants.filter(r => r.status === 'Attended').length,
    cancelled: participants.filter(r => r.status === 'Cancelled').length,
    pending: participants.filter(r => r.status === 'Pending').length,
  };

  const getStatusBadge = (status) => {
    const badges = {
      Confirmed: 'bg-green-500/20 text-green-400',
      Attended: 'bg-blue-500/20 text-blue-400',
      Cancelled: 'bg-red-500/20 text-red-400',
      Pending: 'bg-yellow-500/20 text-yellow-400',
    };
    return badges[status] || 'bg-gray-500/20 text-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-disco-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 relative">
      <div className="container mx-auto px-4">
        {/* Header */}
        <button
          onClick={() => navigate('/organizer')}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-display text-gradient mb-2">
            {event?.eventName}
          </h1>
          <p className="text-gray-400">
            {formatDate(event?.startDate)} • {event?.eventType} Event
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'from-disco-purple to-disco-pink' },
            { label: 'Confirmed', value: stats.confirmed, color: 'from-green-500 to-green-600' },
            { label: 'Attended', value: stats.attended, color: 'from-blue-500 to-blue-600' },
            { label: 'Pending', value: stats.pending, color: 'from-yellow-500 to-yellow-600' },
            { label: 'Cancelled', value: stats.cancelled, color: 'from-red-500 to-red-600' },
            {
              label: 'Revenue',
              value: `₹${event?.registrationFee ? (stats.confirmed + stats.attended) * event.registrationFee : 0}`,
              color: 'from-emerald-500 to-teal-600'
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`bg-gradient-to-br ${stat.color} rounded-lg p-4`}
            >
              <p className="text-white/80 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-glass border border-white/10 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, or ticket ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="attended">Attended</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportCSV}
              className="px-6 py-3 bg-disco-pink/20 hover:bg-disco-pink/30 text-disco-pink rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Download size={20} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Participants Table */}
        <div className="bg-glass border border-white/10 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/30">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium">Participant</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Contact</th>
                  {event?.eventType === 'Merchandise' && (
                    <th className="px-6 py-4 text-left text-sm font-medium">Selection</th>
                  )}
                  <th className="px-6 py-4 text-left text-sm font-medium">Ticket ID</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Attendance</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredParticipants.length > 0 ? (
                  filteredParticipants.map((reg) => (
                    <tr key={reg._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-disco flex items-center justify-center">
                            <span className="font-bold">
                              {reg.participant.firstName[0]}{reg.participant.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {reg.participant.firstName} {reg.participant.lastName}
                            </p>
                            <p className="text-sm text-gray-400">
                              {reg.participant.participantType}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail size={14} className="text-gray-400" />
                            <span className="text-gray-300">{reg.participant.email}</span>
                          </div>
                          {reg.participant.contactNumber && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone size={14} className="text-gray-400" />
                              <span className="text-gray-300">{reg.participant.contactNumber}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      {event?.eventType === 'Merchandise' && (
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {reg.itemSelection ? (
                              <>
                                <p className="text-white font-medium">Qty: {reg.itemSelection.quantity}</p>
                                <p className="text-gray-400 text-xs">
                                  {reg.itemSelection.size && `Size: ${reg.itemSelection.size}`}
                                  {reg.itemSelection.size && reg.itemSelection.color && ' | '}
                                  {reg.itemSelection.color && `Color: ${reg.itemSelection.color}`}
                                </p>
                              </>
                            ) : (
                              <span className="text-gray-500 italic">No selection</span>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-disco-pink">
                          {reg.ticketId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs ${getStatusBadge(reg.status)}`}>
                          {reg.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {reg.attendanceMarked ? (
                          <div className="flex items-center gap-2 text-green-400">
                            <CheckCircle size={18} />
                            <span className="text-sm">
                              {formatDate(reg.attendanceTime, 'MMM dd HH:mm')}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-500">
                            <XCircle size={18} />
                            <span className="text-sm">Not marked</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {reg.status !== 'Cancelled' && (
                          <button
                            onClick={() => openOverrideModal(reg, reg.attendanceMarked ? 'unmark' : 'mark')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${reg.attendanceMarked
                              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
                              : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30'
                              }`}
                          >
                            <Edit2 size={12} />
                            {reg.attendanceMarked ? 'Unmark' : 'Mark Present'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={event?.eventType === 'Merchandise' ? "7" : "6"} className="px-6 py-12 text-center">
                      <Users className="mx-auto mb-4 text-gray-600" size={48} />
                      <p className="text-gray-400">
                        {searchQuery || filterStatus !== 'all'
                          ? 'No participants match your filters'
                          : 'No participants registered yet'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination info */}
          {filteredParticipants.length > 0 && (
            <div className="px-6 py-4 border-t border-white/10 flex justify-between items-center text-sm text-gray-400">
              <p>Showing {filteredParticipants.length} of {participants.length} participants</p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Override Modal */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">
              Manual Attendance Override
            </h3>
            <p className="text-gray-400 mb-6">
              You are about to <span className={overrideAction === 'mark' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>{overrideAction}</span> attendance for <span className="text-white">{selectedRegistration?.participant.firstName} {selectedRegistration?.participant.lastName}</span>.
            </p>

            <form onSubmit={handleOverrideSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  reason for override <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g., Scanner malfunction, forgot ticket, technical issue..."
                  className="w-full h-24 px-4 py-3 bg-black/50 border border-white/20 rounded-lg focus:outline-none focus:border-disco-pink text-sm"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setOverrideModalOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingOverride}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${overrideAction === 'mark'
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    }`}
                >
                  {processingOverride ? 'Processing...' : 'Confirm Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventParticipants;