import TeamChat from '../components/TeamChat';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Copy, Trash2, LogOut, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { teamsAPI } from '../services/api';
import toast from 'react-hot-toast';

const MyTeams = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadTeams();
        const handleNewMessage = () => {
            loadTeams();
        };

        window.addEventListener('new_team_message', handleNewMessage);
        return () => window.removeEventListener('new_team_message', handleNewMessage);
    }, []);

    const loadTeams = async () => {
        try {
            setLoading(true);
            const response = await teamsAPI.getMyTeams();
            setTeams(response.data.teams);
        } catch (error) {
            console.error('Load teams error:', error);
            toast.error('Failed to load your teams');
        } finally {
            setLoading(false);
        }
    };

    const copyInviteLink = (inviteCode) => {
        const link = `${window.location.origin}/join-team/${inviteCode}`;
        navigator.clipboard.writeText(link);
        toast.success('Invite link copied to clipboard!');
    };

    const handleLeaveTeam = async (teamId) => {
        if (!window.confirm('Are you sure you want to leave this team?')) return;

        try {
            await teamsAPI.leave(teamId);
            toast.success('Left team successfully');
            loadTeams();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to leave team');
        }
    };

    const handleDisbandTeam = async (teamId) => {
        if (!window.confirm('Are you sure you want to disband this team? This cannot be undone.')) return;

        try {
            await teamsAPI.disband(teamId);
            toast.success('Team disbanded successfully');
            loadTeams();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to disband team');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-24 flex justify-center">
                <div className="w-12 h-12 border-4 border-disco-cyan border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4">
            <div className="container mx-auto max-w-5xl">
                <h1 className="text-4xl font-display text-gradient border-b border-white/10 pb-4 mb-8">
                    My Teams
                </h1>

                {teams.length === 0 ? (
                    <div className="text-center py-16 bg-glass border border-white/10 rounded-2xl">
                        <Users size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-medium text-white mb-2">No Teams Yet</h3>
                        <p className="text-gray-400 mb-6">Join a hackathon event to create or join a team!</p>
                        <button
                            onClick={() => navigate('/events')}
                            className="btn-retro"
                        >
                            Browse Events
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {teams.map((team) => (
                            <div key={team._id} className="bg-glass border border-white/10 rounded-2xl p-6 relative group overflow-hidden">
                                <div className="absolute top-6 right-2 p-1 opacity-10 text-2xl md:text-4xl font-display text-white pointer-events-none group-hover:scale-110 transition-transform select-none">
                                    {team.inviteCode}
                                </div>

                                <div className="relative z-10">
                                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h2 className="text-2xl font-bold text-white line-clamp-1" title={team.teamName}>{team.teamName}</h2>
                                                {team.unreadCount > 0 && (
                                                    <span className="flex items-center justify-center bg-disco-pink text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 rounded-full animate-pulse">
                                                        {team.unreadCount}
                                                    </span>
                                                )}
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${team.status === 'Complete'
                                                    ? 'bg-green-500/20 border-green-500/30 text-green-400'
                                                    : team.status === 'Disbanded'
                                                        ? 'bg-red-500/20 border-red-500/30 text-red-400'
                                                        : 'bg-disco-cyan/20 border-disco-cyan/30 text-disco-cyan'
                                                    }`}>
                                                    {team.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                <Calendar size={14} />
                                                <span>{team.event?.eventName}</span>
                                            </div>
                                        </div>

                                        {team.status === 'Forming' && (
                                            <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-lg border border-white/10">
                                                <span className="text-gray-400 text-sm">Invite Code:</span>
                                                <code className="text-disco-cyan font-mono font-bold">{team.inviteCode}</code>
                                                <button
                                                    onClick={() => copyInviteLink(team.inviteCode)}
                                                    className="p-1 hover:text-white transition-colors"
                                                    title="Copy Link"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-black/20 rounded-xl p-4 mb-6">
                                        <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">
                                            Members ({team.members.filter(m => m.status === 'Accepted').length + 1}/{team.maxSize})
                                        </h3>
                                        <div className="space-y-3">
                                            {/* Leader */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-disco-pink/20 flex items-center justify-center text-disco-pink font-bold border border-disco-pink/30">
                                                        {team.teamLeader.firstName[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium">
                                                            {team.teamLeader.firstName} {team.teamLeader.lastName}
                                                            <span className="text-xs text-disco-pink ml-2">(Leader)</span>
                                                        </p>
                                                        <p className="text-xs text-gray-500">{team.teamLeader.email}</p>
                                                    </div>
                                                </div>
                                                <CheckCircle size={16} className="text-green-500" />
                                            </div>

                                            {/* Members */}
                                            {team.members.map((member) => (
                                                <div key={member._id} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-300 font-bold border border-white/20">
                                                            {member.user.firstName[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-medium">{member.user.firstName} {member.user.lastName}</p>
                                                            <p className="text-xs text-gray-500">{member.user.email}</p>
                                                        </div>
                                                    </div>
                                                    {member.status === 'Accepted' ? (
                                                        <CheckCircle size={16} className="text-green-500" />
                                                    ) : (
                                                        <span className="text-xs text-yellow-500">{member.status}</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>



                                    {/* Team Chat Section */}
                                    {team.status !== 'Disbanded' && (
                                        <TeamChat
                                            teamId={team._id}
                                            teamName={team.teamName}
                                            members={[
                                                { user: team.teamLeader, _id: 'leader' },
                                                ...team.members
                                            ]}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyTeams;
