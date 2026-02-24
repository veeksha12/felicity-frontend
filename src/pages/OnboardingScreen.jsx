import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Sparkles, ArrowRight, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';

const OnboardingScreen = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1);

    // Available options from backend
    const [availableInterests, setAvailableInterests] = useState([]);
    const [availableClubs, setAvailableClubs] = useState([]);

    // User selections
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [selectedClubs, setSelectedClubs] = useState([]);

    useEffect(() => {
        loadOnboardingOptions();
    }, []);

    const loadOnboardingOptions = async () => {
        try {
            setLoading(true);
            const response = await usersAPI.getOnboardingOptions();
            setAvailableInterests(response.data.interests || []);
            setAvailableClubs(response.data.organizers || []);
        } catch (error) {
            console.error('Load options error:', error);
            toast.error('Failed to load options');
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

    const handleComplete = async () => {
        try {
            setSaving(true);

            await usersAPI.completeOnboarding({
                interests: selectedInterests,
                followedClubs: selectedClubs
            });

            toast.success('Welcome to Felicity! 🎉');
            navigate('/dashboard');
        } catch (error) {
            console.error('Complete onboarding error:', error);
            toast.error('Failed to save preferences');
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = () => {
        navigate('/dashboard');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-4">
            <div className="container mx-auto max-w-4xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="disco-ball w-24 h-24 mx-auto mb-6 rounded-full"
                    />
                    <h1 className="text-5xl font-display text-gradient mb-4">
                        Welcome to Felicity!
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Let's personalize your experience
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-center mb-12">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${step === 1 ? 'bg-gradient-disco' : 'bg-glass'
                            }`}>
                            1
                        </div>
                        <div className={`w-16 h-1 ${step === 2 ? 'bg-gradient-disco' : 'bg-glass'}`} />
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${step === 2 ? 'bg-gradient-disco' : 'bg-glass'
                            }`}>
                            2
                        </div>
                    </div>
                </div>

                {/* Step 1: Interests */}
                {step === 1 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-glass border border-white/10 rounded-2xl p-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Sparkles className="text-disco-pink" size={28} />
                            <h2 className="text-3xl font-display">What interests you?</h2>
                        </div>

                        <p className="text-gray-400 mb-8">
                            Select topics you're interested in to get personalized event recommendations
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                            {availableInterests.map((interest) => (
                                <button
                                    key={interest}
                                    onClick={() => toggleInterest(interest)}
                                    className={`p-4 rounded-lg border-2 transition-all ${selectedInterests.includes(interest)
                                            ? 'border-disco-pink bg-disco-pink/20 scale-105'
                                            : 'border-white/10 bg-white/5 hover:border-white/30'
                                        }`}
                                >
                                    <span className="font-medium">{interest}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={handleSkip}
                                className="flex-1 px-6 py-4 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                Skip for now
                            </button>
                            <button
                                onClick={() => setStep(2)}
                                className="flex-1 btn-retro py-4 flex items-center justify-center gap-2"
                            >
                                Next
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Step 2: Follow Clubs */}
                {step === 2 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-glass border border-white/10 rounded-2xl p-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Heart className="text-disco-pink" size={28} />
                            <h2 className="text-3xl font-display">Follow Clubs</h2>
                        </div>

                        <p className="text-gray-400 mb-8">
                            Follow clubs to stay updated on their events and activities
                        </p>

                        {availableClubs.length > 0 ? (
                            <div className="grid gap-4 mb-8 max-h-96 overflow-y-auto">
                                {availableClubs.map((club) => (
                                    <button
                                        key={club._id}
                                        onClick={() => toggleClub(club._id)}
                                        className={`p-4 rounded-lg border-2 transition-all text-left ${selectedClubs.includes(club._id)
                                                ? 'border-disco-pink bg-disco-pink/10'
                                                : 'border-white/10 bg-white/5 hover:border-white/30'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-gradient-disco flex items-center justify-center text-xl font-bold flex-shrink-0">
                                                    {club.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold mb-1">
                                                        {club.name}
                                                    </h3>
                                                    {club.category && (
                                                        <span className="text-xs px-2 py-1 bg-disco-purple/20 text-disco-purple rounded-full">
                                                            {club.category}
                                                        </span>
                                                    )}
                                                    {club.description && (
                                                        <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                                                            {club.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {selectedClubs.includes(club._id) && (
                                                <Heart className="text-disco-pink" fill="currentColor" size={24} />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 mb-8">
                                <p className="text-gray-400">No clubs available to follow yet</p>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep(1)}
                                className="px-6 py-4 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleSkip}
                                className="flex-1 px-6 py-4 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                Skip for now
                            </button>
                            <button
                                onClick={handleComplete}
                                disabled={saving}
                                className="flex-1 btn-retro py-4 disabled:opacity-50"
                            >
                                {saving ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Saving...
                                    </span>
                                ) : (
                                    'Complete Setup'
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Summary */}
                {(selectedInterests.length > 0 || selectedClubs.length > 0) && (
                    <div className="mt-8 bg-disco-pink/10 border border-disco-pink/30 rounded-lg p-6">
                        <h3 className="font-bold mb-4">Your Selections:</h3>

                        {selectedInterests.length > 0 && (
                            <div className="mb-4">
                                <p className="text-sm text-gray-400 mb-2">Interests ({selectedInterests.length}):</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedInterests.map((interest) => (
                                        <span
                                            key={interest}
                                            className="px-3 py-1 bg-disco-pink/20 text-disco-pink rounded-full text-sm flex items-center gap-2"
                                        >
                                            {interest}
                                            <button
                                                onClick={() => toggleInterest(interest)}
                                                className="hover:text-white"
                                            >
                                                <X size={14} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedClubs.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-400 mb-2">Following ({selectedClubs.length}) clubs</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OnboardingScreen;