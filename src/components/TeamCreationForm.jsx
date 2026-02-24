import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Users, Plus, X } from 'lucide-react';
import { teamsAPI } from '../services/api';
import toast from 'react-hot-toast';

const TeamCreationForm = ({ eventId, onSuccess, onCancel }) => {
    const [submitting, setSubmitting] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        try {
            setSubmitting(true);
            const payload = {
                teamName: data.teamName,
                eventId,
                maxSize: parseInt(data.maxSize)
            };

            const response = await teamsAPI.create(payload);
            toast.success('Team created successfully!');
            if (onSuccess) onSuccess(response.data);
        } catch (error) {
            console.error('Create team error:', error);
            const msg = error.response?.data?.message || 'Failed to create team';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-glass border border-white/10 rounded-2xl p-6 relative">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-display text-gradient flex items-center gap-2">
                    <Users size={24} className="text-disco-cyan" />
                    Create New Team
                </h3>
                {onCancel && (
                    <button onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Team Name</label>
                    <input
                        {...register('teamName', {
                            required: 'Team name is required',
                            minLength: { value: 3, message: 'Minimum 3 characters' }
                        })}
                        type="text"
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-cyan"
                        placeholder="e.g. The Hackers"
                    />
                    {errors.teamName && (
                        <p className="text-red-400 text-xs mt-1">{errors.teamName.message}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Team Size (Members)</label>
                    <div className="relative">
                        <select
                            {...register('maxSize', { required: 'Team size is required' })}
                            className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-cyan appearance-none"
                        >
                            {[2, 3, 4, 5, 6].map(num => (
                                <option key={num} value={num} className="bg-gray-900 text-white">
                                    {num} Members
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            ▼
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        Choose carefully. Tickets are generated only when the team is full.
                    </p>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full btn-retro py-3 flex items-center justify-center gap-2 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Creating...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Plus size={18} />
                                Create Team & Get Invite Code
                            </span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TeamCreationForm;
