import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Mail, Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { usersAPI } from '../services/api';
import { useAuthStore } from '../store/useStore';
import { formatDate, formatCurrency, getEventStatus, getEventStatusColor } from '../utils/helpers';
import toast from 'react-hot-toast';

const ClubDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [organizer, setOrganizer] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    loadClubDetails();
    if (user?.role === 'Participant') {
      checkFollowStatus();
    }
  }, [id]);

  const loadClubDetails = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getOrganizerById(id);
      
      setOrganizer(response.data.organizer);
      setUpcomingEvents(response.data.upcomingEvents || []);
      setPastEvents(response.data.pastEvents || []);
    } catch (error) {
      console.error('Load club error:', error);
      toast.error('Failed to load club details');
      navigate('/clubs');
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const response = await usersAPI.getProfile();
      const followedClubs = response.data.followedClubs?.map(club => club._id || club) || [];
      setIsFollowing(followedClubs.includes(id));
    } catch (error) {
      console.error('Check follow status error:', error);
    }
  };

  const handleFollow = async () => {
    if (!user || user.role !== 'Participant') {
      toast.error('Please login as a participant to follow clubs');
      return;
    }

    try {
      await usersAPI.followClub({ clubId: id });
      setIsFollowing(true);
      toast.success('Successfully followed club');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to follow club');
    }
  };

  const handleUnfollow = async () => {
    try {
      await usersAPI.unfollowClub(id);
      setIsFollowing(false);
      toast.success('Successfully unfollowed club');
    } catch (error) {
      toast.error('Failed to unfollow club');
    }
  };

  const EventCard = ({ event }) => {
    const status = getEventStatus(event);
    const statusColor = getEventStatusColor(status);

    return (
      <Link
        to={`/events/${event._id}`}
        className="bg-glass border border-white/10 rounded-lg p-6 hover:border-disco-pink/50 transition-all group"
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold group-hover:text-disco-pink transition-colors line-clamp-2">
            {event.eventName}
          </h3>
          <span className={`${statusColor} text-white text-xs px-3 py-1 rounded-full whitespace-nowrap ml-4`}>
            {status}
          </span>
        </div>

        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {event.description}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar size={16} className="text-disco-pink" />
            <span>{formatDate(event.startDate)}</span>
          </div>

          {event.venue && (
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin size={16} className="text-disco-pink" />
              <span className="truncate">{event.venue}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-700">
            <div className="flex items-center gap-2 text-gray-400">
              <Users size={16} />
              <span>{event.currentRegistrations || 0} / {event.registrationLimit}</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-disco-pink">
              <DollarSign size={16} />
              <span>{formatCurrency(event.registrationFee)}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!organizer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-xl mb-6">Club not found</p>
          <button
            onClick={() => navigate('/clubs')}
            className="btn-retro py-3 px-8"
          >
            Back to Clubs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/clubs')}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Clubs
        </button>

        {/* Club Header */}
        <div className="bg-glass border border-white/10 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Club Avatar */}
            <div className="w-32 h-32 rounded-full bg-gradient-disco flex items-center justify-center text-5xl font-bold flex-shrink-0">
              {organizer.firstName.charAt(0)}
            </div>

            {/* Club Info */}
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-4xl font-display text-gradient mb-2">
                    {organizer.firstName} {organizer.lastName}
                  </h1>
                  {organizer.category && (
                    <span className="inline-block px-4 py-1 bg-disco-purple/20 text-disco-purple rounded-full">
                      {organizer.category}
                    </span>
                  )}
                </div>

                {/* Follow Button */}
                {user?.role === 'Participant' && (
                  <button
                    onClick={isFollowing ? handleUnfollow : handleFollow}
                    className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
                      isFollowing
                        ? 'bg-disco-pink/20 text-disco-pink hover:bg-disco-pink/30'
                        : 'bg-glass border border-disco-pink hover:bg-disco-pink/10'
                    }`}
                  >
                    <Heart
                      size={20}
                      fill={isFollowing ? 'currentColor' : 'none'}
                    />
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>

              {/* Description */}
              {organizer.description && (
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {organizer.description}
                </p>
              )}

              {/* Contact Info */}
              <div className="flex flex-wrap gap-4 text-sm">
                {organizer.email && (
                  <a
                    href={`mailto:${organizer.email}`}
                    className="flex items-center gap-2 text-gray-400 hover:text-disco-pink transition-colors"
                  >
                    <Mail size={16} />
                    <span>{organizer.email}</span>
                  </a>
                )}
                {organizer.contactEmail && organizer.contactEmail !== organizer.email && (
                  <a
                    href={`mailto:${organizer.contactEmail}`}
                    className="flex items-center gap-2 text-gray-400 hover:text-disco-pink transition-colors"
                  >
                    <Mail size={16} />
                    <span>{organizer.contactEmail}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Events Section */}
        <div>
          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-6 py-3 rounded-lg transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-gradient-disco text-white'
                  : 'bg-glass hover:bg-white/10'
              }`}
            >
              Upcoming Events ({upcomingEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-6 py-3 rounded-lg transition-colors ${
                activeTab === 'past'
                  ? 'bg-gradient-disco text-white'
                  : 'bg-glass hover:bg-white/10'
              }`}
            >
              Past Events ({pastEvents.length})
            </button>
          </div>

          {/* Events Grid */}
          {activeTab === 'upcoming' && (
            <div>
              {upcomingEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingEvents.map((event, index) => (
                    <motion.div
                      key={event._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <EventCard event={event} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-glass border border-white/10 rounded-lg p-12 text-center">
                  <Calendar className="mx-auto mb-4 text-gray-600" size={48} />
                  <p className="text-gray-400">No upcoming events</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'past' && (
            <div>
              {pastEvents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastEvents.map((event, index) => (
                    <motion.div
                      key={event._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <EventCard event={event} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-glass border border-white/10 rounded-lg p-12 text-center">
                  <Calendar className="mx-auto mb-4 text-gray-600" size={48} />
                  <p className="text-gray-400">No past events</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClubDetail;