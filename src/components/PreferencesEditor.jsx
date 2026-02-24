import { useState, useEffect } from 'react';
import { Heart, Sparkles, Check, X } from 'lucide-react';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';

const PreferencesEditor = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);

    // Available options
    const [availableInterests, setAvailableInterests] = useState([]);
    const [availableClubs, setAvailableClubs] = useState([]);

    // Current selections
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [selectedClubs, setSelectedClubs] = useState([]);

    // Original selections (for cancel)
    const [originalInterests, setOriginalInterests] = useState([]);
    const [originalClubs, setOriginalClubs] = useState([]);

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            setLoading(true);

            // Get current user profile
            const profileResponse = await usersAPI.getProfile();
            const currentInterests = profileResponse.data.interests || [];
            const currentClubs = profileResponse.data.followedClubs || [];

            setSelectedInterests(currentInterests);
            setOriginalInterests(currentInterests);
            setSelectedClubs(currentClubs);
            setOriginalClubs(currentClubs);

            // Get available options
            const optionsResponse = await usersAPI.getOnboardingOptions();
            setAvailableInterests(optionsResponse.data.interests || []);
            setAvailableClubs(optionsResponse.data.organizers || []);
        } catch (error) {
            console.error('Load preferences error:', error);
            toast.error('Failed to load preferences');
        } finally {
            setLoading(false);
        }
    };

    const toggleInterest = (interest) => {
        setSelectedInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
    };

    const toggleClub = (clubId) => {
        setSelectedClubs(prev =>
            prev.includes(clubId)
                ? prev.filter(id => id !== clubId)
                : [...prev, clubId]
        );
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            await usersAPI.setPreferences({
                interests: selectedInterests,
                followedClubs: selectedClubs
            });

            setOriginalInterests(selectedInterests);
            setOriginalClubs(selectedClubs);
            setEditing(false);
            toast.success('Preferences updated successfully');
        } catch (error) {
            console.error('Save preferences error:', error);
            toast.error(error.response?.data?.message || 'Failed to save preferences');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setSelectedInterests(originalInterests);
        setSelectedClubs(originalClubs);
        setEditing(false);
    };

    const hasChanges = () => {
        const interestsChanged = JSON.stringify(selectedInterests.sort()) !== JSON.stringify(originalInterests.sort());
        const clubsChanged = JSON.stringify(selectedClubs.sort()) !== JSON.stringify(originalClubs.sort());
        return interestsChanged || clubsChanged;
    };

    if (loading) {
        return (
            <div className="bg-glass border border-white/10 rounded-2xl p-8 mb-6">
                <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-2 border-disco-pink border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-glass border border-white/10 rounded-2xl p-8 mb-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-display">Preferences</h2>
                {!editing && (
                    <button
                        onClick={() => setEditing(true)}
                        className="px-4 py-2 bg-disco-pink/20 hover:bg-disco-pink/30 text-disco-pink rounded-lg transition-colors"
                    >
                        Edit Preferences
                    </button>
                )}
            </div>

            {/* Interests Section */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="text-disco-pink" size={20} />
                    <h3 className="text-lg font-medium">Interests</h3>
                </div>

                {editing ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {availableInterests.map((interest) => (
                            <button
                                key={interest}
                                onClick={() => toggleInterest(interest)}
                                className={`p-3 rounded-lg border-2 transition-all text-sm ${selectedInterests.includes(interest)
                                        ? 'border-disco-pink bg-disco-pink/20'
                                        : 'border-white/10 bg-white/5 hover:border-white/30'
                                    }`}
                            >
                                {interest}
                            </button>
                        ))}
                    </div>
                ) : selectedInterests.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {selectedInterests.map((interest) => (
                            <span
                                key={interest}
                                className="px-3 py-1 bg-disco-pink/20 text-disco-pink rounded-full text-sm"
                            >
                                {interest}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-sm">No interests selected yet</p>
                )}
            </div>

            {/* Followed Clubs Section */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Heart className="text-disco-pink" size={20} />
                    <h3 className="text-lg font-medium">Following</h3>
                </div>

                {editing ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {availableClubs.map((club) => (
                            <button
                                key={club._id}
                                onClick={() => toggleClub(club._id)}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${selectedClubs.includes(club._id)
                                        ? 'border-disco-pink bg-disco-pink/10'
                                        : 'border-white/10 bg-white/5 hover:border-white/30'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-disco flex items-center justify-center text-sm font-bold flex-shrink-0">
                                            {club.name?.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">
                                                {club.name}
                                            </h4>
                                            {club.category && (
                                                <span className="text-xs px-2 py-0.5 bg-disco-purple/20 text-disco-purple rounded-full">
                                                    {club.category}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {selectedClubs.includes(club._id) && (
                                        <Heart className="text-disco-pink" fill="currentColor" size={20} />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                ) : selectedClubs.length > 0 ? (
                    <div className="space-y-2">
                        {availableClubs
                            .filter(club => selectedClubs.includes(club._id))
                            .map((club) => (
                                <div
                                    key={club._id}
                                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-disco flex items-center justify-center text-xs font-bold">
                                        {club.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">{club.name}</p>
                                        {club.category && (
                                            <span className="text-xs text-gray-400">{club.category}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-sm">Not following any clubs yet</p>
                )}
            </div>

            {/* Action Buttons (shown when editing) */}
            {editing && (
                <div className="flex gap-4 pt-4 border-t border-white/10">
                    <button
                        onClick={handleCancel}
                        className="flex-1 px-6 py-3 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges()}
                        className="flex-1 btn-retro py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Check size={20} />
                                Save Preferences
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

export default PreferencesEditor;
