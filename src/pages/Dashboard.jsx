import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Ticket, TrendingUp, Award } from 'lucide-react';
import { registrationsAPI } from '../services/api';
import { useAuthStore } from '../store/useStore';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    upcoming: 0,
    completed: 0,
    total: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await registrationsAPI.getMyEvents();
      const data = response.data;

      setStats({
        upcoming: data.upcoming?.length || 0,
        completed: data.completed?.length || 0,
        total: data.all?.length || 0,
      });

      setUpcomingEvents(data.upcoming?.slice(0, 5) || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Events', value: stats.total, icon: Ticket, color: 'from-disco-purple to-disco-pink' },
    { label: 'Upcoming', value: stats.upcoming, icon: Calendar, color: 'from-retro-teal to-retro-violet' },
    { label: 'Completed', value: stats.completed, icon: Award, color: 'from-retro-orange to-retro-yellow' },
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-display mb-2">
            Welcome back, <span className="text-gradient">{user?.firstName}</span>
          </h1>
          <p className="text-gray-400">Here's what's happening with your events</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {statCards.map((stat) => (
            <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-6 relative overflow-hidden`}>
              <div className="relative z-10">
                <p className="text-white/80 mb-2">{stat.label}</p>
                <p className="text-5xl font-bold">{loading ? '...' : stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming Events */}
        <div className="bg-glass border border-white/10 rounded-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-display text-gradient">Upcoming Events</h2>
            <Link to="/my-events" className="text-disco-pink hover:text-disco-purple transition-colors">
              View All
            </Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-black/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map((registration) => (
                <Link
                  key={registration._id}
                  to={`/events/${registration.event._id}`}
                  className="flex items-center justify-between p-4 bg-black/30 hover:bg-black/50 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-disco flex items-center justify-center">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h3 className="font-medium group-hover:text-disco-pink transition-colors line-clamp-1" title={registration.event.eventName}>
                        {registration.event.eventName}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {formatDate(registration.event.eventStartDate || registration.event.startDate)}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                    Registered
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="mx-auto mb-4 text-gray-600" size={48} />
              <p className="text-gray-400">No upcoming events</p>
              <Link to="/events" className="mt-4 inline-block btn-retro py-2 px-6 text-sm">
                Browse Events
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;