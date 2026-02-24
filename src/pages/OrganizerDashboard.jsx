import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Users, DollarSign, Edit, Trash2, Eye, CheckCircle, Clock, Camera, Key, Play, X } from 'lucide-react';
import { eventsAPI } from '../services/api';
import toast from 'react-hot-toast';

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, draft, published, ongoing, closed, completed

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getMyEvents();
      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Load events error:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (eventId, newStatus) => {
    try {
      await eventsAPI.updateStatus(eventId, newStatus);
      toast.success(`Event marked as ${newStatus.toLowerCase()}`);
      loadEvents();
    } catch (error) {
      console.error('Status update error:', error);
      toast.error(error.response?.data?.message || `Failed to update status to ${newStatus}`);
    }
  };

  const handlePublish = async (eventId) => {
    try {
      await eventsAPI.updateStatus(eventId, 'Published');
      toast.success('Event published successfully!');
      loadEvents();
    } catch (error) {
      console.error('Publish error:', error);
      toast.error(error.response?.data?.message || 'Failed to publish event');
    }
  };

  const handleUnpublish = async (eventId) => {
    try {
      await eventsAPI.updateStatus(eventId, 'Draft');
      toast.success('Event unpublished');
      loadEvents();
    } catch (error) {
      console.error('Unpublish error:', error);
      toast.error(error.response?.data?.message || 'Failed to unpublish event');
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      toast.success('Event deleted');
      loadEvents();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete event');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      Draft: 'bg-gray-500/20 text-gray-300',
      Published: 'bg-green-500/20 text-green-300',
      Ongoing: 'bg-blue-500/20 text-blue-300',
      Closed: 'bg-orange-500/20 text-orange-300',
      Completed: 'bg-indigo-500/20 text-indigo-300',
      Cancelled: 'bg-red-500/20 text-red-300'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badges[status] || badges.Draft}`}>
        {status}
      </span>
    );
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    return event.status.toLowerCase() === filter.toLowerCase();
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-disco-pink border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-display text-gradient">My Events</h1>
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/organizer/password-reset')}
              className="px-6 py-3 border border-white/20 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              <Key size={20} />
              Password Reset
            </button>
            <button
              onClick={() => navigate('/create-event')}
              className="btn-retro px-6 py-3"
            >
              Create New Event
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
          {['all', 'draft', 'published', 'ongoing', 'closed', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-6 py-2 rounded-lg capitalize whitespace-nowrap transition-colors ${filter === tab
                ? 'bg-disco-pink text-white'
                : 'bg-white/5 hover:bg-white/10'
                }`}
            >
              {tab}
              <span className="ml-2 text-xs opacity-75">
                ({events.filter(e => tab === 'all' || e.status.toLowerCase() === tab).length})
              </span>
            </button>
          ))}
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="bg-glass border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-gray-400 text-lg">
              {filter === 'all'
                ? 'No events yet. Create your first event!'
                : `No ${filter} events`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event._id}
                className="bg-glass border border-white/10 rounded-2xl p-6 hover:border-disco-pink/50 transition-all"
              >
                {/* Event Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-display text-white mb-2">
                      {event.eventName}
                    </h3>
                    {getStatusBadge(event.status)}
                  </div>
                </div>

                {/* Event Info */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar size={16} />
                    <span>{new Date(event.eventStartDate || event.startDate).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Users size={16} />
                    <span>{event.currentRegistrations || 0} / {event.registrationLimit} registered</span>
                  </div>

                  {event.registrationFee > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <DollarSign size={16} />
                      <span>₹{event.registrationFee}</span>
                    </div>
                  )}

                  <div className="text-sm text-gray-400">
                    Type: <span className="text-white">{event.eventType}</span>
                  </div>
                </div>

                {/* ✅ FIXED: Actions with correct paths */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {/* View Button - FIXED PATH */}
                  <button
                    onClick={() => navigate(`/events/${event._id}`)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    title="View Details"
                  >
                    <Eye size={16} />
                    <span className="text-sm">View</span>
                  </button>

                  {/* Participants - FIXED PATH */}
                  <Link
                    to={`/event/${event._id}/participants`}
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    title="View Participants"
                  >
                    <Users size={16} />
                    <span className="text-sm">Participants</span>
                  </Link>

                  {/* Edit Button - Visible for Draft and Published */}
                  {['Draft', 'Published'].includes(event.status) && (
                    <button
                      onClick={() => navigate(`/edit-event/${event._id}`)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center gap-2 transition-colors"
                      title="Edit Event"
                    >
                      <Edit size={16} />
                      <span className="text-sm">Edit</span>
                    </button>
                  )}

                  {/* Lifecycle Transitions */}
                  {event.status === 'Draft' && (
                    <button
                      onClick={() => handlePublish(event._id)}
                      className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg flex items-center justify-center gap-2 transition-colors"
                      title="Publish Event"
                    >
                      <CheckCircle size={16} />
                      <span className="text-sm">Publish</span>
                    </button>
                  )}

                  {event.status === 'Published' && (
                    <>
                      <button
                        onClick={() => handleUnpublish(event._id)}
                        className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        title="Unpublish Event"
                      >
                        <Clock size={16} />
                        <span className="text-sm">Unpublish</span>
                      </button>

                      <button
                        onClick={() => handleStatusUpdate(event._id, 'Ongoing')}
                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        title="Mark as Ongoing"
                      >
                        <Play size={16} />
                        <span className="text-sm">Start</span>
                      </button>

                      <button
                        onClick={() => handleStatusUpdate(event._id, 'Closed')}
                        className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        title="Close Registrations"
                      >
                        <X size={16} />
                        <span className="text-sm">Close</span>
                      </button>
                    </>
                  )}

                  {event.status === 'Ongoing' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(event._id, 'Completed')}
                        className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        title="Mark as Completed"
                      >
                        <CheckCircle size={16} />
                        <span className="text-sm">Complete</span>
                      </button>

                      <button
                        onClick={() => handleStatusUpdate(event._id, 'Closed')}
                        className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        title="Close Registrations"
                      >
                        <X size={16} />
                        <span className="text-sm">Close</span>
                      </button>
                    </>
                  )}

                  {/* QR Scanner */}
                  {['Published', 'Ongoing', 'Completed'].includes(event.status) && (
                    <Link
                      to={`/event/${event._id}/scanner`}
                      className="px-4 py-2 bg-disco-pink/20 hover:bg-disco-pink/30 text-disco-pink rounded-lg flex items-center justify-center gap-2 transition-colors"
                      title="QR Scanner"
                    >
                      <Camera size={16} />
                      <span className="text-sm">Scanner</span>
                    </Link>
                  )}

                  {/* Payment Management (for paid events) */}
                  {event.registrationFee > 0 && (
                    <Link
                      to={`/event/${event._id}/payments`}
                      className="px-4 py-2 text-yellow-400 rounded-lg flex items-center justify-center gap-2 transition-colors"
                      title="Payment Management"
                    >
                      <DollarSign size={16} />
                      <span className="text-sm">Payments</span>
                    </Link>
                  )}
                </div>

                {/* Draft Warning */}
                {event.status === 'Draft' && (
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-xs text-yellow-300">
                      ⚠️ This event is not visible to participants. Click "Publish" to make it public.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerDashboard;