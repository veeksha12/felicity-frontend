import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Download, XCircle, Ticket, MapPin } from 'lucide-react';
import { registrationsAPI } from '../services/api';
import { formatDate, formatDateTime } from '../utils/helpers';
import toast from 'react-hot-toast';

const MyEvents = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [events, setEvents] = useState({
    all: [],
    upcoming: [],
    completed: [],
    cancelled: [],
    normal: [],
    merchandise: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const response = await registrationsAPI.getMyEvents();
      setEvents(response.data);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegistration = async (registrationId) => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) {
      return;
    }

    try {
      await registrationsAPI.cancel(registrationId);
      toast.success('Registration cancelled successfully!');
      fetchMyEvents(); // Reload events
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel registration');
    }
  };

  const tabs = [
    { key: 'all', label: 'All Events' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
    { key: 'normal', label: 'Normal Events' },
    { key: 'merchandise', label: 'Merchandise' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const displayEvents = events[activeTab] || [];

  const getStatusColor = (status) => {
    const colors = {
      'Confirmed': 'bg-green-500/20 text-green-400',
      'Attended': 'bg-blue-500/20 text-blue-400',
      'Cancelled': 'bg-red-500/20 text-red-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-display text-gradient mb-8">My Events</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 rounded-lg transition-all whitespace-nowrap ${activeTab === tab.key
                  ? 'bg-gradient-disco text-white shadow-disco'
                  : 'bg-glass hover:bg-white/10'
                }`}
            >
              {tab.label} ({events[tab.key]?.length || 0})
            </button>
          ))}
        </div>

        {/* Events List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-glass rounded-lg animate-pulse" />
            ))}
          </div>
        ) : displayEvents.length > 0 ? (
          <div className="grid gap-4">
            {displayEvents.map((reg) => (
              <div
                key={reg._id}
                className="bg-glass border border-white/10 rounded-lg p-6 hover:border-disco-pink/50 transition-all"
              >
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  {/* Event Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold mb-2 line-clamp-1" title={reg.event?.eventName}>
                          {reg.event?.eventName}
                        </h3>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={16} />
                            {formatDateTime(reg.event?.startDate)}
                          </span>
                          {reg.event?.venue && (
                            <span className="flex items-center gap-1">
                              <MapPin size={16} />
                              {reg.event.venue}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(reg.status)}`}>
                        {reg.status}
                      </span>
                    </div>

                    {/* Ticket ID */}
                    {reg.ticketId && (
                      <div className="bg-black/30 px-3 py-2 rounded-lg inline-block mb-3">
                        <span className="text-sm text-gray-400">Ticket ID: </span>
                        <span className="text-sm font-mono text-disco-pink">{reg.ticketId}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 items-start">
                    <Link
                      to={`/events/${reg.event?._id}`}
                      className="px-4 py-2 bg-glass hover:bg-white/10 rounded-lg transition-colors text-sm flex items-center gap-2"
                    >
                      View Event
                    </Link>

                    {reg.ticketId && reg.status === 'Confirmed' && (
                      <button
                        onClick={() => navigate(`/ticket/${reg._id}`)}
                        className="px-4 py-2 bg-disco-pink/20 hover:bg-disco-pink/30 text-disco-pink rounded-lg transition-colors text-sm flex items-center gap-2"
                      >
                        <Ticket size={16} />
                        View Ticket
                      </button>
                    )}

                    {reg.status === 'Confirmed' && (
                      <button
                        onClick={() => handleCancelRegistration(reg._id)}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm flex items-center gap-2"
                      >
                        <XCircle size={16} />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Calendar className="mx-auto mb-4 text-gray-600" size={48} />
            <p className="text-gray-400 mb-6">No events in this category</p>
            <Link to="/events" className="btn-retro py-3 px-8 text-sm inline-block">
              Explore Events
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEvents;
