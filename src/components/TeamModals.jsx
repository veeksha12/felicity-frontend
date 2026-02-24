import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, X, Copy, Share2 } from 'lucide-react';
import { teamsAPI } from '../services/api';
import toast from 'react-hot-toast';

export const CreateTeamModal = ({ isOpen, onClose, eventId, maxTeamSize, onTeamCreated }) => {
    const [teamName, setTeamName] = useState('');
    const [loading, setLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!teamName.trim()) return;

        try {
            setLoading(true);
            const response = await teamsAPI.create({
                teamName,
                eventId,
                maxSize: maxTeamSize
            });

            setInviteLink(response.data.inviteLink);
            toast.success('Team created successfully!');
            if (onTeamCreated) onTeamCreated(response.data.team);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create team');
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
            toast.success('Invite link copied!');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-display text-white">Create New Team</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {inviteLink ? (
                    <div className="space-y-6">
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Users className="text-green-500" size={24} />
                            </div>
                            <p className="text-green-400 font-medium mb-1">Team Created!</p>
                            <p className="text-sm text-gray-400">Share this link to invite members</p>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inviteLink}
                                readOnly
                                className="flex-1 px-4 py-3 bg-black/50 border border-white/10 rounded-lg text-sm text-gray-300"
                            />
                            <button
                                onClick={copyLink}
                                className="px-4 py-3 bg-disco-purple/20 text-disco-purple hover:bg-disco-purple/30 rounded-lg transition-colors"
                            >
                                <Copy size={20} />
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full btn-retro py-3"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Team Name</label>
                            <input
                                type="text"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                                placeholder="e.g. The Hackers"
                                required
                            />
                        </div>

                        <div className="bg-white/5 p-4 rounded-lg">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">Team Size</span>
                                <span className="text-white">{maxTeamSize} Members</span>
                            </div>
                            <p className="text-xs text-gray-500">
                                You will be the team leader.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-retro py-3 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Team'
                            )}
                        </button>
                    </form>
                )}
            </motion.div>
        </div>
    );
};

export const JoinTeamModal = ({ isOpen, onClose, onTeamJoined }) => {
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inviteCode.trim()) return;

        try {
            setLoading(true);
            const response = await teamsAPI.join({ inviteCode });

            toast.success('Joined team successfully!');
            if (onTeamJoined) onTeamJoined(response.data.team);
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to join team');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-md w-full"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-display text-white">Join Existing Team</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Invite Code</label>
                        <input
                            type="text"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                            className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink tracking-widest text-center font-mono text-lg"
                            placeholder="A1B2C3D4"
                            maxLength={8}
                            required
                        />
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Ask your team leader for the invite code
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-retro py-3 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Joining...
                            </>
                        ) : (
                            'Join Team'
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};
