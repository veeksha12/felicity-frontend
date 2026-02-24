import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, Image, Paperclip, MoreVertical, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useStore';

const TeamChat = ({ teamId, teamName, members = [] }) => {
    const { user, token } = useAuthStore();
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const messagesEndRef = useRef(null);

    // Typing state
    const [typingUsers, setTypingUsers] = useState(new Map());
    const [typingTimer, setTypingTimer] = useState(null);

    // Online status state
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [teamMembers, setTeamMembers] = useState([]);

    // Fetch team members
    useEffect(() => {
        const fetchMembers = async () => {
            // We can get members from the team details. 
            // Since we don't have a direct "get members" API here, we can rely on the parent component passing it 
            // or fetch the team details again. 
            // The API getTeamByInviteCode exists, but we have teamId here.
            // We can use api.get('/teams/my-teams') but that returns all.
            // Let's assume we can pass `members` as a prop or fetch it.
            // For now, let's fetch the chat history which includes sender details, 
            // but that doesn't give us all members (some might not have chatted).
            // Let's fetch the specific team details using a new endpoint or reusing.
            // Actually, `MyTeams.jsx` has the team object with members! We should pass it as a prop.
            // But for now, let's fetch it if not passed.
            try {
                // Determine if we can get team details. 
                // Let's try to get it from the chat history endpoint if we modify it to return members?
                // Or better, let's just use the `teamsAPI.get(teamId)` if it existed.
                // Since I cannot easily change the props passed from MyTeams (it's in the same file as TeamChat usually or close),
                // let's look at MyTeams.jsx again. It passes `teamId` and `teamName`.
                // I'll update MyTeams.jsx to pass `members` prop in the next step.
                // For now, I'll set up the state.
            } catch (err) {
                console.error(err);
            }
        };
        // fetchMembers();
    }, [teamId]);

    // Initialize Socket
    useEffect(() => {
        if (!token) return;

        console.log('Initializing socket for team:', teamId);

        const socketUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace('/api', '');
        const newSocket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        setSocket(newSocket);

        // Connect event
        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            setIsConnected(true);
            newSocket.emit('join_team_chat', { teamId });
        });

        // Receive message
        newSocket.on('new_team_message', (message) => {
            console.log('New message received:', message);
            setMessages((prev) => [...prev, message]);
        });

        // Initial online users list
        newSocket.on('team_online_users', (userIds) => {
            setOnlineUsers(new Set(userIds));
        });

        // User status change
        newSocket.on('user_status_change', ({ userId, status }) => {
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                if (status === 'online') {
                    newSet.add(userId);
                } else {
                    newSet.delete(userId);
                }
                return newSet;
            });
        });

        // Typing indicator listener
        newSocket.on('user_typing', ({ userId, isTyping, userName }) => {
            setTypingUsers(prev => {
                const newMap = new Map(prev);
                if (isTyping) {
                    newMap.set(userId, userName);
                } else {
                    newMap.delete(userId);
                }
                return newMap;
            });
        });

        // Errors
        newSocket.on('error', (err) => {
            console.error('Socket error:', err);
            toast.error(err.message || 'Chat error');
        });

        // Cleanup
        return () => {
            newSocket.emit('typing', { teamId, isTyping: false, userName: user?.firstName });
            newSocket.disconnect();
        };
    }, [teamId, token, user]);

    // Load History
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoadingHistory(true);
                // We'll need to add a corresponding API method in services/api.js or call axios directly
                // For now let's assume api.get works
                const response = await api.get(`/chat/history/${teamId}`);
                if (response.data && response.data.messages) {
                    setMessages(response.data.messages); // Removed reverse() to keep chronological order (oldest -> newest)
                }
            } catch (error) {
                console.error('Failed to load history:', error);
            } finally {
                setLoadingHistory(false);
            }
        };

        if (teamId) {
            fetchHistory();
        }
    }, [teamId]);

    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, typingUsers]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket || !isConnected) return;

        socket.emit('send_team_message', {
            teamId,
            message: newMessage,
            type: 'text'
        });

        setNewMessage('');
        // Stop typing
        socket.emit('typing', { teamId, isTyping: false, userName: user?.firstName });
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Basic validation
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            setIsUploading(true);
            const response = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const { fileUrl, mimetype, filename } = response.data;
            const type = mimetype.startsWith('image/') ? 'image' : 'file';

            socket.emit('send_team_message', {
                teamId,
                message: filename, // Use filename as message text for files
                type,
                fileUrl
            });

            toast.success('File sent');
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to upload file');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        if (socket) {
            socket.emit('typing', { teamId, isTyping: true });
            // Debounce stop typing (simplified)
            setTimeout(() => socket.emit('typing', { teamId, isTyping: false }), 3000);
        }
    };

    return (
        <div className="flex flex-col h-[500px] bg-glass border border-white/10 rounded-2xl overflow-hidden mt-6">
            <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center gap-4">
                <h3 className="font-display text-lg px-2 truncate min-w-0" title={teamName}>
                    {teamName}
                </h3>
                <div className="px-2 flex-shrink-0 flex flex-col items-end">
                    <div className="text-xs text-gray-400 mb-1">
                        {onlineUsers.size} Online
                    </div>
                    <div className="flex -space-x-2 overflow-hidden">
                        {members.slice(0, 5).map(member => (
                            <div
                                key={member.user._id}
                                className={`relative w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-xs font-bold text-white flex-shrink-0
                                    ${onlineUsers.has(member.user._id) ? 'bg-green-500' : 'bg-gray-600 grayscale opacity-50'}
                                `}
                                title={`${member.user.firstName} ${member.user.lastName} (${onlineUsers.has(member.user._id) ? 'Online' : 'Offline'})`}
                            >
                                {member.user.firstName[0]}
                                {onlineUsers.has(member.user._id) && (
                                    <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 border border-black rounded-full"></span>
                                )}
                            </div>
                        ))}
                        {members.length > 5 && (
                            <div className="relative w-8 h-8 rounded-full border-2 border-black bg-gray-800 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                +{members.length - 5}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingHistory ? (
                    <div className="flex justify-center p-4">
                        <div className="w-6 h-6 border-2 border-disco-pink border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                        No messages yet. Start chatting with your team!
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                        const senderName = msg.sender?.firstName || 'Unknown';
                        const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        return (
                            <div key={msg._id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? 'bg-disco-purple text-white rounded-br-none' : 'bg-white/10 text-gray-200 rounded-bl-none'
                                    }`}>
                                    {!isMe && <div className="text-xs text-disco-cyan mb-1">{senderName}</div>}

                                    {msg.type === 'image' ? (
                                        <div className="mb-1">
                                            <a href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${msg.fileUrl}`} target="_blank" rel="noopener noreferrer">
                                                <img
                                                    src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${msg.fileUrl}`}
                                                    alt="Shared image"
                                                    className="rounded-lg max-h-48 object-cover border border-white/20"
                                                />
                                            </a>
                                        </div>
                                    ) : msg.type === 'file' ? (
                                        <a
                                            href={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${msg.fileUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 bg-black/20 rounded-lg hover:bg-black/40 transition-colors mb-1"
                                        >
                                            <Paperclip size={16} />
                                            <span className="underline truncate">{msg.message || 'Attachment'}</span>
                                        </a>
                                    ) : (
                                        <p className="text-sm">{msg.message}</p>
                                    )}

                                    <div className="text-[10px] opacity-50 text-right mt-1">
                                        {time}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {typingUsers.size > 0 && (
                <div className="px-4 py-1 text-xs text-disco-cyan italic animate-pulse">
                    {Array.from(typingUsers.values()).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                </div>
            )}

            <form onSubmit={handleSendMessage} className="p-4 bg-white/5 border-t border-white/10 flex gap-2 items-center">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isConnected || isUploading}
                    className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    title="Upload File"
                >
                    {isUploading ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : <Paperclip size={20} />}
                </button>

                <input
                    type="text"
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder="Type a message..."
                    className="flex-1 bg-black/50 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-disco-pink"
                />
                <button
                    type="submit"
                    disabled={!isConnected || !newMessage.trim()}
                    className="bg-disco-pink p-2 rounded-full text-white disabled:opacity-50 hover:bg-disco-pink/80 transition-colors"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default TeamChat;
