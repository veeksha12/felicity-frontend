import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, User, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { teamsAPI } from '../services/api';
import toast from 'react-hot-toast';

const JoinTeam = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (code) {
            loadTeamDetails();
        }
    }, [code]);

    const loadTeamDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await teamsAPI.getByInviteCode(code);
            setTeam(response.data.team);
        } catch (error) {
            console.error('Load team error:', error);
            setError(error.response?.data?.message || 'Invalid invite code or team not found');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        try {
            setJoining(true);
            await teamsAPI.join({ inviteCode: code });
            toast.success('Joined team successfully!');
            navigate('/my-teams');
        } catch (error) {
            console.error('Join team error:', error);
            toast.error(error.response?.data?.message || 'Failed to join team');
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-disco-cyan border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-glass border border-red-500/30 rounded-2xl p-8 text-center">
                    <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Unavailable</h2>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <button onClick={() => navigate('/events')} className="btn-retro w-full">
                        Browse Events
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-20 px-4 flex items-center justify-center">
            <div className="max-w-lg w-full bg-glass border border-white/10 rounded-2xl overflow-hidden relative">
                <div className="absolute top-0 w-full h-2 bg-gradient-to-r from-disco-cyan to-disco-pink" />

                <div className="p-8 text-center border-b border-white/10">
                    <div className="w-20 h-20 bg-disco-cyan/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-disco-cyan/20">
                        <Users size={40} className="text-disco-cyan" />
                    </div>
                    <h1 className="text-3xl font-display text-white mb-2">You're Invited!</h1>
                    <p className="text-gray-400">Join <span className="text-white font-bold">{team.teamName}</span> for the hackathon</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/30 p-4 rounded-xl border border-white/10">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Event</p>
                            <p className="text-white font-medium truncate">{team.event?.eventName}</p>
                        </div>
                        <div className="bg-black/30 p-4 rounded-xl border border-white/10">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Members</p>
                            <p className="text-white font-medium">{team.currentSize} / {team.maxSize}</p>
                        </div>
                    </div>

                    <div className="bg-black/30 p-4 rounded-xl border border-white/10 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-disco-pink/20 flex items-center justify-center text-disco-pink font-bold border border-disco-pink/30">
                            {team.teamLeader.firstName[0]}
                        </div>
                        <div>
                            <p className="text-white font-medium">
                                {team.teamLeader.firstName} {team.teamLeader.lastName}
                            </p>
                            <p className="text-xs text-gray-500">Team Leader</p>
                        </div>
                    </div>

                    <div className="pt-4">
                        {team.isFull ? (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
                                <p className="text-yellow-500 font-medium">This team is full</p>
                            </div>
                        ) : (
                            <button
                                onClick={handleJoin}
                                disabled={joining}
                                className="w-full btn-retro py-4 flex items-center justify-center gap-2 group"
                            >
                                {joining ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Joining...
                                    </>
                                ) : (
                                    <>
                                        Accept Invitation
                                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => navigate('/')}
                        className="w-full text-center text-gray-500 hover:text-white text-sm transition-colors"
                    >
                        Decline & Go Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JoinTeam;
