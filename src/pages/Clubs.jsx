import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, Users, Mail, ArrowRight, X } from 'lucide-react';
import { motion } from 'framer-motion';
import Fuse from 'fuse.js';
import { usersAPI } from '../services/api';
import { useAuthStore } from '../store/useStore';
import toast from 'react-hot-toast';

const Clubs = () => {
  const { user } = useAuthStore();
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [followedClubs, setFollowedClubs] = useState([]);

  useEffect(() => {
    fetchOrganizers();
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchOrganizers = async () => {
    try {
      const response = await usersAPI.getAllOrganizers();
      setOrganizers(response.data);
    } catch (error) {
      toast.error('Failed to load clubs');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await usersAPI.getProfile();
      setFollowedClubs(response.data.followedClubs?.map(club => club._id || club) || []);
    } catch (error) {
      console.error('Failed to fetch user profile');
    }
  };

  const handleFollow = async (clubId) => {
    try {
      await usersAPI.followClub({ clubId });
      setFollowedClubs([...followedClubs, clubId]);
      toast.success('Successfully followed club');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to follow club');
    }
  };

  const handleUnfollow = async (clubId) => {
    try {
      await usersAPI.unfollowClub(clubId);
      setFollowedClubs(followedClubs.filter(id => id !== clubId));
      toast.success('Successfully unfollowed club');
    } catch (error) {
      toast.error('Failed to unfollow club');
    }
  };

  const isFollowing = (clubId) => followedClubs.includes(clubId);

  // Configure Fuse.js for fuzzy search on clubs
  const fuse = useMemo(() => {
    const fuseOptions = {
      keys: [
        { name: 'firstName', weight: 0.3 },
        { name: 'lastName', weight: 0.3 },
        { name: 'name', weight: 0.3 }, // Combined name field
        { name: 'description', weight: 0.2 },
        { name: 'category', weight: 0.2 }
      ],
      threshold: 0.3, // More strict matching for clubs
      distance: 100,
      minMatchCharLength: 2,
      includeScore: true,
    };

    return new Fuse(organizers, fuseOptions);
  }, [organizers]);

  // Apply fuzzy search
  const filteredOrganizers = useMemo(() => {
    if (!searchQuery.trim()) {
      return organizers;
    }

    const searchResults = fuse.search(searchQuery);
    return searchResults.map(result => result.item);
  }, [organizers, searchQuery, fuse]);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-display mb-4">
            <span className="text-gradient">Clubs & Organizers</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Discover amazing clubs and follow them to get updates on their events
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search clubs by name, description, or category"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-glass border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            )}
          </div>
          {/* Search Results Counter */}
          {searchQuery && (
            <div className="text-sm text-gray-400 mt-2">
              Found {filteredOrganizers.length} club{filteredOrganizers.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </div>
          )}
        </div>

        {/* Clubs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-glass rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredOrganizers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrganizers.map((organizer, index) => {
              // Support both combined name and firstName/lastName
              const displayName = organizer.name || `${organizer.firstName} ${organizer.lastName}`;
              const avatarInitial = organizer.name?.charAt(0) || organizer.firstName?.charAt(0);

              return (
                <motion.div
                  key={organizer._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-glass border border-white/10 rounded-2xl p-6 hover:border-disco-pink/50 transition-all group"
                >
                  {/* Club Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-disco flex items-center justify-center text-2xl font-bold">
                      {avatarInitial}
                    </div>
                    {user && user.role === 'Participant' && (
                      <button
                        onClick={() => isFollowing(organizer._id) ? handleUnfollow(organizer._id) : handleFollow(organizer._id)}
                        className={`p-2 rounded-lg transition-colors ${
                          isFollowing(organizer._id)
                            ? 'bg-disco-pink/20 text-disco-pink hover:bg-disco-pink/30'
                            : 'bg-glass hover:bg-white/10'
                        }`}
                      >
                        <Heart 
                          size={20} 
                          fill={isFollowing(organizer._id) ? 'currentColor' : 'none'}
                        />
                      </button>
                    )}
                  </div>

                  {/* Club Info */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-disco-pink transition-colors">
                      {displayName}
                    </h3>
                    {organizer.category && (
                      <span className="inline-block px-3 py-1 bg-disco-purple/20 text-disco-purple text-xs rounded-full mb-3">
                        {organizer.category}
                      </span>
                    )}
                    <p className="text-gray-400 text-sm line-clamp-3">
                      {organizer.description || 'No description available'}
                    </p>
                  </div>

                  {/* Club Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    {organizer.contactNumber && (
                      <div className="flex items-center gap-1">
                        <Users size={16} />
                        <span>Contact</span>
                      </div>
                    )}
                    {organizer.email && (
                      <div className="flex items-center gap-1">
                        <Mail size={16} />
                        <span>Email</span>
                      </div>
                    )}
                  </div>

                  {/* View Details Button */}
                  <Link
                    to={`/clubs/${organizer._id}`}
                    className="flex items-center justify-between w-full py-2 px-4 bg-black/30 hover:bg-black/50 rounded-lg transition-colors group"
                  >
                    <span className="text-sm">View Details</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="disco-ball w-24 h-24 mx-auto mb-6 rounded-full" />
            <h3 className="text-2xl font-display mb-2">No Clubs Found</h3>
            <p className="text-gray-400">
              {searchQuery ? 'Try adjusting your search' : 'No clubs are registered yet'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-6 py-3 bg-disco-pink hover:bg-disco-purple transition-colors rounded-lg"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Clubs;