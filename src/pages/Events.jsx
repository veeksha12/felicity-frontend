import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Calendar, MapPin, Users, DollarSign, X, Tag, Clock, Info, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';
import { eventsAPI } from '../services/api';
import { formatDate, formatCurrency, getEventStatus, getEventStatusColor } from '../utils/helpers';
import toast from 'react-hot-toast';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    type: '',
    eligibility: '',
    tags: '',
    startDate: '',
    endDate: '',
  });

  // Common event tags for quick filtering
  const popularTags = [
    'Music', 'Dance', 'Tech', 'Workshop', 'Competition',
    'Cultural', 'Sports', 'Art', 'Food', 'Gaming'
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Fetch all events without search query - we'll do fuzzy search client-side
      const response = await eventsAPI.browse({
        type: filters.type,
        eligibility: filters.eligibility,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
      setEvents(response.data.events || []);
    } catch (error) {
      toast.error('Failed to load events');
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refetch when filters change (except search)
  useEffect(() => {
    fetchEvents();
  }, [filters.type, filters.eligibility, filters.startDate, filters.endDate]);

  // Configure Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    const fuseOptions = {
      keys: [
        { name: 'eventName', weight: 0.4 },
        { name: 'description', weight: 0.3 },
        { name: 'eventTags', weight: 0.2 },
        { name: 'venue', weight: 0.1 }
      ],
      threshold: 0.4, // 0.0 = perfect match, 1.0 = match anything
      distance: 100,
      minMatchCharLength: 2,
      includeScore: true,
      useExtendedSearch: true,
    };

    return new Fuse(events, fuseOptions);
  }, [events]);

  // Apply fuzzy search and tag filtering
  const filteredEvents = useMemo(() => {
    let results = events;

    // Apply fuzzy search if search query exists
    if (filters.search.trim()) {
      const searchResults = fuse.search(filters.search);
      results = searchResults.map(result => result.item);
    }

    // Apply tag filtering
    if (filters.tags) {
      const selectedTags = filters.tags.split(',').map(t => t.trim()).filter(Boolean);
      if (selectedTags.length > 0) {
        results = results.filter(event =>
          event.eventTags?.some(tag =>
            selectedTags.some(selectedTag =>
              tag.toLowerCase().includes(selectedTag.toLowerCase())
            )
          )
        );
      }
    }

    return results;
  }, [events, filters.search, filters.tags, fuse]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleTag = (tag) => {
    const currentTags = filters.tags ? filters.tags.split(',').map(t => t.trim()) : [];

    if (currentTags.includes(tag)) {
      // Remove tag
      const newTags = currentTags.filter(t => t !== tag);
      handleFilterChange('tags', newTags.join(','));
    } else {
      // Add tag
      handleFilterChange('tags', [...currentTags, tag].join(','));
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      eligibility: '',
      tags: '',
      startDate: '',
      endDate: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some((val) => val !== '');
  const selectedTags = filters.tags ? filters.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-display mb-4">
            <span className="text-gradient">All Events</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Discover exciting events and register to participate
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar with Fuzzy Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search events by name, description, tags, or venue"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-glass border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink transition-colors"
              />
              {filters.search && (
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-4 bg-glass border border-white/10 rounded-lg hover:border-disco-pink transition-colors flex items-center gap-2 justify-center lg:justify-start"
            >
              <Filter size={20} />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-disco-pink rounded-full animate-pulse" />
              )}
            </button>
          </div>

          {/* Search Results Counter */}
          {filters.search && (
            <div className="text-sm text-gray-400">
              Found {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} matching "{filters.search}"
            </div>
          )}

          {/* Quick Tag Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="text-disco-pink" size={18} />
            <span className="text-sm text-gray-400">Quick filters:</span>
            {popularTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${selectedTags.includes(tag)
                  ? 'bg-disco-pink/20 text-disco-pink border border-disco-pink'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/30'
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-glass border border-white/10 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Event Type */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Event Type</label>
                      <select
                        value={filters.type}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                        className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                      >
                        <option value="">All Types</option>
                        <option value="Normal">Normal</option>
                        <option value="Merchandise">Merchandise</option>
                      </select>
                    </div>

                    {/* Eligibility */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Eligibility</label>
                      <select
                        value={filters.eligibility}
                        onChange={(e) => handleFilterChange('eligibility', e.target.value)}
                        className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                      >
                        <option value="">All</option>
                        <option value="All">Open to All</option>
                        <option value="IIIT Only">IIIT Only</option>
                        <option value="Non-IIIT Only">Non-IIIT Only</option>
                      </select>
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Start Date</label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-sm font-medium mb-2">End Date</label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                      />
                    </div>
                  </div>

                  {/* Clear Filters */}
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="mt-4 px-4 py-2 text-sm text-red-400 hover:text-red-300 flex items-center gap-2"
                    >
                      <X size={16} />
                      Clear all filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Filters Display */}
          {selectedTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-400">Active tags:</span>
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-disco-pink/20 text-disco-pink rounded-full text-sm flex items-center gap-2"
                >
                  {tag}
                  <button
                    onClick={() => toggleTag(tag)}
                    className="hover:text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="event-card h-80 animate-pulse" />
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, index) => {
              const status = getEventStatus(event);
              const statusColor = getEventStatusColor(status);

              return (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link
                    to={`/events/${event._id}`}
                    className="event-card block h-full group overflow-hidden"
                  >
                    {/* Event Image Placeholder */}
                    <div className="h-48 bg-gradient-to-br from-disco-purple to-disco-pink relative overflow-hidden">
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                      <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                        <span className={`px-3 py-1 ${statusColor} text-white text-xs rounded-full`}>
                          {status.replace('-', ' ')}
                        </span>
                        <span className="px-3 py-1 bg-black/50 backdrop-blur-sm text-white text-xs rounded-full">
                          {event.eventType}
                        </span>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-3 group-hover:text-disco-pink transition-colors line-clamp-2">
                        {event.eventName}
                      </h3>

                      <div className="relative mb-4">
                        <p className={`text-gray-400 text-sm leading-relaxed ${expandedEvent === event._id ? '' : 'line-clamp-3'}`}>
                          {event.eventDescription || event.description}
                        </p>
                        {(event.eventDescription || event.description)?.length > 150 && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setExpandedEvent(expandedEvent === event._id ? null : event._id);
                            }}
                            className="text-disco-pink text-xs mt-1 hover:underline"
                          >
                            {expandedEvent === event._id ? 'Show Less' : 'Read More'}
                          </button>
                        )}
                      </div>

                      {/* Event Tags */}
                      {event.eventTags && event.eventTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {event.eventTags.slice(0, 5).map((tag, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-disco-purple/20 text-disco-purple text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="space-y-3 text-sm mb-4">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Calendar size={16} className="text-disco-pink" />
                          <span>
                            {formatDate(event.eventStartDate || event.startDate)} - {formatDate(event.eventEndDate || event.endDate)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Clock size={16} className="text-disco-pink" />
                            <span className="text-xs">Deadline: {formatDate(event.registrationDeadline)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Info size={16} className="text-disco-pink" />
                            <span className="text-xs">{event.eligibility}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Users size={16} className="text-disco-pink" />
                            <span>
                              {event.participationType === 'Individual' ? 'Individual' :
                                event.participationType === 'Team' ? `Team (${event.minTeamSize}-${event.maxTeamSize})` :
                                  'Indiv/Team'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Tag size={16} className="text-disco-pink" />
                            <span>{event.eventMode || 'Offline'}</span>
                          </div>
                        </div>

                        {event.venue && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <MapPin size={16} className="text-disco-pink" />
                            <span className="truncate">{event.venue}</span>
                          </div>
                        )}

                        <div className="flex gap-3 pt-1">
                          {event.rules && (
                            <span className="flex items-center gap-1 text-[10px] bg-white/5 px-2 py-1 rounded border border-white/10 text-gray-400">
                              <Info size={12} /> Rules
                            </span>
                          )}
                          {event.prizes?.length > 0 && (
                            <span className="flex items-center gap-1 text-[10px] bg-disco-gold/10 px-2 py-1 rounded border border-disco-gold/20 text-disco-gold">
                              <DollarSign size={12} /> Prizes
                            </span>
                          )}
                        </div>

                        {event.organizerId && (
                          <div className="flex items-center gap-2 text-gray-400 border-t border-white/5 pt-2">
                            <div className="w-5 h-5 rounded-full bg-disco-pink/20 flex items-center justify-center text-[10px] font-bold text-disco-pink">
                              {event.organizerId.firstName?.[0] || 'O'}
                            </div>
                            <span className="text-xs">Org: {event.organizerId.firstName} {event.organizerId.lastName}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                          <div className="flex items-center gap-2 text-gray-400">
                            {event.eventType === 'Merchandise' ? (
                              <>
                                <Package size={16} className={
                                  (event.itemDetails?.stockQuantity || 0) <= 10
                                    ? 'text-red-400'
                                    : (event.itemDetails?.stockQuantity || 0) <= 25
                                      ? 'text-amber-400'
                                      : 'text-disco-cyan'
                                } />
                                <span className={`font-semibold text-sm ${(event.itemDetails?.stockQuantity || 0) <= 10
                                  ? 'text-red-400'
                                  : (event.itemDetails?.stockQuantity || 0) <= 25
                                    ? 'text-amber-400'
                                    : 'text-disco-cyan'
                                  }`}>
                                  {event.itemDetails?.stockQuantity || 0} in stock
                                  {(event.itemDetails?.stockQuantity || 0) <= 10 && ' · Low!'}
                                </span>
                              </>
                            ) : (
                              <>
                                <Users size={16} />
                                <span>{event.currentRegistrations}/{event.registrationLimit} spots</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 font-bold text-disco-pink">
                            <DollarSign size={16} />
                            <span>{formatCurrency(event.registrationFee)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="disco-ball w-24 h-24 mx-auto mb-6 rounded-full" />
            <h3 className="text-2xl font-display mb-2">No Events Found</h3>
            <p className="text-gray-400 mb-6">
              {hasActiveFilters
                ? 'Try adjusting your filters or search terms'
                : 'Check back later for new events'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-disco-pink hover:bg-disco-purple transition-colors rounded-lg"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;