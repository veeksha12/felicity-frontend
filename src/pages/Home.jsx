import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Sparkles, ArrowRight } from 'lucide-react';
import { eventsAPI } from '../services/api';
import { getTimeUntilEvent, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';


const Home = () => {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Felicity event dates
  const felicityStartDate = new Date('2026-02-13T00:00:00');

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown(getTimeUntilEvent(felicityStartDate));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const [eventsRes, trendingRes] = await Promise.all([
        eventsAPI.browse({ limit: 6 }),
        eventsAPI.getTrending(),
      ]);
      setFeaturedEvents((eventsRes.data.events || []).slice(0, 6));
      setTrendingEvents(trendingRes.data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-disco-purple/20 to-black" />
          <div className="retro-grid absolute inset-0 opacity-20" />

          {/* Floating Disco Balls */}
          <div className="disco-ball absolute top-20 left-10 w-20 h-20 rounded-full opacity-30 animate-float" />
          <div className="disco-ball absolute top-40 right-20 w-32 h-32 rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }} />
          <div className="disco-ball absolute bottom-40 left-1/4 w-16 h-16 rounded-full opacity-25 animate-float" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="vinyl-record w-64 h-64 flex items-center justify-center overflow-hidden rounded-full">
                <img
                  src="/logo.png"
                  alt="Felicity Logo"
                  className="w-6/7 h-6/7 object-contain"
                />
              </div>
            </div>

            {/* Main Title - Extra Large */}
            <h1 className="text-9xl md:text-[12rem] font-black tracking-widest mb-8">
              <span className="text-gradient">FELICITY</span>
              <span className="text-white">'26</span>
            </h1>

            <div className="h-6" />

            {/* Subtitle - Large but readable */}
            <h2 className="text-4xl md:text-5xl font-medium">
              IIIT Hyderabad's Annual Cultural Festival
            </h2>

            <div className="h-6" />

            {/* Countdown */}
            <div className="flex justify-center gap-4 md:gap-8 flex-wrap">
              {[
                { label: 'DAYS', value: countdown.days },
                { label: 'HOURS', value: countdown.hours },
                { label: 'MINUTES', value: countdown.minutes },
                { label: 'SECONDS', value: countdown.seconds },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-glass border border-disco-pink/30 rounded-lg p-4 md:p-6 min-w-[80px] md:min-w-[100px]"
                >
                  <div className="text-3xl md:text-5xl font-display text-gradient">
                    {String(item.value).padStart(2, '0')}
                  </div>
                  <div className="text-xs md:text-sm text-gray-400 mt-2">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Event Dates */}
            <div className="flex items-center justify-center space-x-2 text-xl md:text-2xl font-display">
              <Calendar className="text-disco-pink" />
              <span className="text-gradient">13-15 FEB 2026</span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Link to="/events" className="btn-retro group">
                EXPLORE EVENTS
                <ArrowRight className="inline-block ml-2 group-hover:translate-x-2 transition-transform" size={20} />
              </Link>
              <Link to="/register" className="btn-retro group">
                REGISTER NOW
                <ArrowRight className="inline-block ml-2 group-hover:translate-x-2 transition-transform" size={20} />
              </Link>
            </div>
          </motion.div>
        </div>

      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl md:text-5xl font-display mb-6">
              <span className="text-gradient">About Felicity</span>
            </h2>

            <div className="h-6" />

            <p className="text-lg text-gray-300 leading-relaxed mb-8">
              Felicity is IIIT Hyderabad's largest and most vibrant annual fest, bringing together
              students from across the country for a celebration of culture, creativity, and community.
              Known for its eclectic mix of cultural performances, competitions, workshops, and flagship
              events, Felicity transforms the campus into a hub of energy and expression.
            </p>

            <div className="h-6" />

            <p className="text-lg text-gray-300 leading-relaxed">
              This year, Felicity embraces the <span className="text-disco-pink font-bold">Retro Disco theme</span>,
              drawing inspiration from classic retro Bollywood, where shimmering disco balls, vinyl aesthetics,
              and iconic melodies of the '70s and '80s set the mood.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-20 relative">
        <div className="absolute inset-0 retro-grid opacity-5" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-4xl md:text-5xl font-display">
              <span className="text-gradient">Upcoming Events</span>
            </h2>
            <Link
              to="/events"
              className="text-disco-pink hover:text-disco-purple transition-colors flex items-center gap-2 group"
            >
              View All
              <ArrowRight className="group-hover:translate-x-2 transition-transform" size={20} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="event-card h-64 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.map((event, index) => (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link to={`/events/${event._id}`} className="event-card block p-6 h-full group">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-disco-purple/20 text-disco-purple text-xs rounded-full">
                        {event.eventType}
                      </span>
                      <span className="text-sm text-gray-400">
                        {formatDate(event.startDate, 'MMM dd')}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold mb-3 group-hover:text-disco-pink transition-colors line-clamp-1" title={event.eventName}>
                      {event.eventName}
                    </h3>

                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Users size={16} />
                        <span>{event.registrationLimit} spots</span>
                      </div>
                      {event.venue && (
                        <div className="flex items-center gap-2 text-gray-400">
                          <MapPin size={16} />
                          <span className="truncate max-w-[120px]">{event.venue}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && featuredEvents.length === 0 && (
            <div className="text-center py-20">
              <Sparkles className="mx-auto mb-4 text-disco-pink" size={48} />
              <h3 className="text-2xl font-display mb-2">No Events Yet</h3>
              <p className="text-gray-400">Stay tuned for exciting events coming soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Trending Events */}
      <section className="py-20 bg-black/30 relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-4xl md:text-5xl font-display">
              <span className="text-gradient">Trending Now</span>
            </h2>
          </div>

          {!loading && trendingEvents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingEvents.map((event, index) => (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link to={`/events/${event._id}`} className="event-card block p-6 h-full group border-disco-cyan/30 hover:border-disco-cyan">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-disco-cyan/20 text-disco-cyan text-xs rounded-full flex items-center gap-1">
                        <Sparkles size={12} />
                        Trending
                      </span>
                      <span className="text-sm text-gray-400">
                        {formatDate(event.startDate, 'MMM dd')}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold mb-3 group-hover:text-disco-cyan transition-colors line-clamp-1" title={event.eventName}>
                      {event.eventName}
                    </h3>

                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Users size={16} />
                        <span className="text-white">{event.currentRegistrations}</span>
                        <span> registered</span>
                      </div>
                      <div className="text-disco-cyan font-bold">
                        {event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && trendingEvents.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500">Trending events will appear here once registrations pick up!</p>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-disco relative overflow-hidden">
        <div className="absolute inset-0 bg-black/50" />
        <div className="vinyl-record absolute -top-20 -left-20 w-64 h-64 opacity-20" />
        <div className="vinyl-record absolute -bottom-20 -right-20 w-96 h-96 opacity-20" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-6xl font-display mb-6">
              Ready to Experience Felicity?
            </h2>

            <div className="h-6" />

            <h2 className="text-4xl md:text-5xl font-medium">
              Join thousands of students in celebrating art, culture, and creativity
            </h2>

            <div className="h-6" />

            <Link to="/register" className="inline-block px-12 py-5 bg-black text-white font-bold text-xl uppercase tracking-wider hover:scale-105 transition-transform">
              Get Started
            </Link>

          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
