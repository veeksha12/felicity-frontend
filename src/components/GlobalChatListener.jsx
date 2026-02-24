import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/useStore';
import toast from 'react-hot-toast';

const GlobalChatListener = () => {
    const { user, token } = useAuthStore();

    useEffect(() => {
        if (!user || !token) return;

        const socketUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace('/api', '');
        const socket = io(socketUrl, {
            auth: { token },
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            console.log('Global notification listener connected');
        });

        socket.on('new_notification', (data) => {
            console.log('New notification received:', data);

            // Play notification sound if desired (optional)

            // Show toast
            toast((t) => (
                <div
                    onClick={() => {
                        toast.dismiss(t.id);
                        // Navigation could happen here if we used useNavigate
                        window.location.href = `/my-teams`;
                    }}
                    className="cursor-pointer"
                >
                    <p className="font-bold text-sm">{data.senderName} in {data.teamName}</p>
                    <p className="text-xs truncate max-w-[200px]">{data.message}</p>
                </div>
            ), {
                duration: 4000,
                position: 'top-right',
                style: {
                    background: '#1a1a1a',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.1)',
                },
                icon: '💬',
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [user, token]);

    return null; // This component handles side effects only
};

export default GlobalChatListener;
