import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, ArrowLeft, Calendar, MapPin, User as UserIcon, Ticket as TicketIcon } from 'lucide-react';
import { registrationsAPI } from '../services/api';
import toast from 'react-hot-toast';

const TicketView = () => {
  const { registrationId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTicket();
  }, [registrationId]);

  const fetchTicket = async () => {
    try {
      const response = await registrationsAPI.getRegistrationById(registrationId);
      setTicket(response.data);
    } catch (err) {
      console.error('Fetch ticket error:', err);
      setError('Failed to load ticket');
      toast.error('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const downloadTicket = () => {
    if (!ticket || !ticket.qrCode) {
      toast.error('QR code not available');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 1000;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ec4899';
    ctx.fillRect(0, 0, canvas.width, 100);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('FELICITY EVENT TICKET', canvas.width / 2, 60);

    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Event: ${ticket.event.title}`, 50, 180);
    ctx.fillText(`Date: ${new Date(ticket.event.date).toLocaleDateString()}`, 50, 230);
    ctx.fillText(`Time: ${ticket.event.time}`, 50, 280);
    ctx.fillText(`Venue: ${ticket.event.venue}`, 50, 330);
    ctx.fillText(`Ticket ID: ${ticket.ticketId}`, 50, 380);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 250, 450, 300, 300);
      
      ctx.fillStyle = '#ec4899';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Scan this QR code at the venue', canvas.width / 2, 830);

      const link = document.createElement('a');
      link.download = `felicity-ticket-${ticket.ticketId}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast.success('Ticket downloaded successfully');
    };
    img.onerror = () => {
      toast.error('Failed to download ticket');
    };
    img.src = ticket.qrCode;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-6">{error || 'Ticket not found'}</p>
          <button
            onClick={() => navigate('/my-events')}
            className="btn-retro py-3 px-8 flex items-center gap-2 mx-auto"
          >
            <ArrowLeft size={20} />
            Back to My Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <button
          onClick={() => navigate('/my-events')}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to My Events
        </button>

        <div className="bg-gradient-to-br from-disco-purple to-disco-pink rounded-3xl p-8 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <TicketIcon size={32} />
                </div>
                <div>
                  <h1 className="text-3xl font-display">Event Ticket</h1>
                  <p className="text-white/80">Felicity'26</p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                ticket.status === 'Confirmed' 
                  ? 'bg-green-500/20 text-green-400' 
                  : ticket.status === 'Attended'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {ticket.status}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">{ticket.event.title}</h2>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar size={18} />
                  <div>
                    <p className="text-white/60 text-xs">Date</p>
                    <p className="font-medium">
                      {new Date(ticket.event.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar size={18} />
                  <div>
                    <p className="text-white/60 text-xs">Time</p>
                    <p className="font-medium">{ticket.event.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin size={18} />
                  <div>
                    <p className="text-white/60 text-xs">Venue</p>
                    <p className="font-medium">{ticket.event.venue}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <TicketIcon size={18} />
                  <div>
                    <p className="text-white/60 text-xs">Type</p>
                    <p className="font-medium">{ticket.event.type}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <UserIcon size={18} />
                Participant Information
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-white/60">Name:</span>{' '}
                  <span className="font-medium">
                    {ticket.participant.firstName} {ticket.participant.lastName}
                  </span>
                </p>
                <p>
                  <span className="text-white/60">Email:</span>{' '}
                  <span className="font-medium">{ticket.participant.email}</span>
                </p>
                <p>
                  <span className="text-white/60">Ticket ID:</span>{' '}
                  <span className="font-mono font-medium">{ticket.ticketId}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {ticket.qrCode && (
          <div className="bg-glass border border-white/10 rounded-2xl p-8 mb-6">
            <h3 className="text-xl font-display text-center mb-4">Entry QR Code</h3>
            <div className="flex justify-center">
              <div className="bg-white p-6 rounded-2xl">
                <img
                  src={ticket.qrCode}
                  alt="Ticket QR Code"
                  className="w-64 h-64"
                />
              </div>
            </div>
            <p className="text-center text-gray-400 mt-4 text-sm">
              Scan this QR code at the event venue for entry
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={downloadTicket}
            className="flex-1 btn-retro py-4 flex items-center justify-center gap-2"
          >
            <Download size={20} />
            Download Ticket
          </button>
        </div>

        <div className="mt-8 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-sm text-yellow-400 flex items-start gap-2">
            <span className="text-xl">⚠️</span>
            <span>
              <strong>Important:</strong> Please carry a valid ID along with this ticket. 
              Entry will be allowed only after successful QR code verification at the venue.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TicketView;
