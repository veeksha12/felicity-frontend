import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, Users, DollarSign, Clock, Info, ArrowLeft, CheckCircle, Package, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { eventsAPI, registrationsAPI, teamsAPI } from '../services/api';
import { useAuthStore } from '../store/useStore';
import { formatDate, formatDateTime, formatCurrency, getEventStatus, getEventStatusColor, isEventPast } from '../utils/helpers';
import toast from 'react-hot-toast';
import { CreateTeamModal, JoinTeamModal } from '../components/TeamModals';


const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showJoinTeam, setShowJoinTeam] = useState(false);
  const [formData, setFormData] = useState({});
  const [itemSelection, setItemSelection] = useState({ quantity: 1 });
  const [activeTab, setActiveTab] = useState('details');
  const [isRegistered, setIsRegistered] = useState(false);
  const [myTeam, setMyTeam] = useState(null);

  useEffect(() => {
    fetchEvent();
    if (isAuthenticated && user?.role === 'Participant') {
      checkRegistrationStatus();
    }
  }, [id, isAuthenticated, user]);

  const checkRegistrationStatus = async () => {
    try {
      const response = await registrationsAPI.getMyRegistrations();
      const registered = response.data.some(reg =>
        reg.event?._id === id && ['Confirmed', 'Attended'].includes(reg.status)
      );
      setIsRegistered(registered);
    } catch (error) {
      console.error('Error checking registration:', error);
    }
  };

  const fetchEvent = async () => {
    try {
      const response = await eventsAPI.getById(id);
      setEvent(response.data);
    } catch (error) {
      toast.error('Failed to load event');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to register');
      navigate('/login');
      return;
    }

    if (user?.role !== 'Participant') {
      toast.error('Only participants can register for events');
      return;
    }

    setShowRegisterModal(true);
  };

  const submitRegistration = async () => {
    try {
      setRegistering(true);
      const payload = { eventId: id, formData };
      if (event.eventType === 'Merchandise') {
        const details = event.itemDetails || {};
        if (details.sizes?.length > 0 && details.isSizeRequired !== false && !itemSelection.size) {
          toast.error('Please select a size');
          return;
        }
        if (details.colors?.length > 0 && details.isColorRequired !== false && !itemSelection.color) {
          toast.error('Please select a color');
          return;
        }
        payload.itemSelection = itemSelection;
      }
      await registrationsAPI.register(payload);
      toast.success('Registration successful! Check your email for the ticket.');
      navigate('/my-events');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  useEffect(() => console.log(event), [event])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!event) return null;

  const status = getEventStatus(event);
  const statusColor = getEventStatusColor(status);
  const isFull = event.currentRegistrations >= event.registrationLimit;
  const canRegister = status === 'published' && !isEventPast(event.registrationDeadline) && !isFull;

  const isEligible =
    !isAuthenticated ||
    event.eligibility === 'All' ||
    (event.eligibility === 'IIIT Only' && user?.participantType === 'IIIT') ||
    (event.eligibility === 'Non-IIIT Only' && user?.participantType === 'Non-IIIT');

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Events
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Image */}
            <div className="relative h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-disco-purple to-disco-pink">
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <h1 className="text-5xl font-display text-center px-8">{event.eventName}</h1>
              </div>
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={`px-4 py-2 ${statusColor} text-white rounded-full`}>
                  {status.replace('-', ' ')}
                </span>
                <span className="px-4 py-2 bg-black/50 backdrop-blur-sm text-white rounded-full">
                  {event.eventType}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-glass border border-white/10 rounded-2xl p-8">
              <h2 className="text-2xl font-display text-gradient mb-4">About This Event</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Additional Details */}
            {(event.rules || event.prizes?.length > 0) && (
              <div className="bg-glass border border-white/10 rounded-2xl p-8 space-y-6">
                {event.rules && (
                  <div>
                    <h3 className="text-xl font-display text-gradient mb-3">Rules & Guidelines</h3>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                      {event.rules}
                    </p>
                  </div>
                )}

                {event.prizes?.length > 0 && (
                  <div>
                    <h3 className="text-xl font-display text-gradient mb-3">Prizes</h3>
                    <div className="space-y-2">
                      {event.prizes.map((prize, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-black/30 rounded-lg">
                          <span className="font-medium">{prize.position}</span>
                          <span className="text-disco-gold">{formatCurrency(prize.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <div className="bg-glass border border-white/10 rounded-2xl p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-gradient mb-2">
                  {formatCurrency(event.registrationFee)}
                </div>
                <p className="text-sm text-gray-400">Registration Fee</p>
              </div>

              {canRegister ? (
                user?.role === 'Organizer' ? (
                  <div className="w-full py-4 bg-gray-700/50 text-center rounded-lg mb-4 text-gray-400">
                    Organizers cannot register for events
                  </div>
                ) : !isEligible ? (
                  <div className="w-full py-4 bg-red-900/40 text-red-400 border border-red-500/40 text-center rounded-lg mb-4 font-medium">
                    🚫 {event.eligibility === 'IIIT Only' ? 'IIIT Students Only' : 'Non-IIIT Students Only'}
                  </div>
                ) : (
                  <>
                    {/* Individual Registration */}
                    {(!event.participationType || event.participationType === 'Individual' || event.participationType === 'Both') && !isRegistered && !myTeam && (
                      <button
                        onClick={handleRegister}
                        className="w-full btn-retro py-4 mb-4"
                      >
                        Register Now
                      </button>
                    )}

                    {/* Team Registration - Hidden for Merchandise */}
                    {(event.participationType === 'Team' || event.participationType === 'Both') && event.eventType !== 'Merchandise' && !isRegistered && !myTeam && (
                      <div className="space-y-3 mb-4">
                        {event.participationType === 'Team' && (
                          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
                            <p className="text-yellow-500 text-sm font-medium">Team Participation Required</p>
                          </div>
                        )}
                        <button
                          onClick={() => setShowCreateTeam(true)}
                          className="w-full py-3 border border-disco-cyan/50 text-disco-cyan hover:bg-disco-cyan/10 rounded-lg transition-colors font-medium"
                        >
                          Create New Team
                        </button>
                        <button
                          onClick={() => setShowJoinTeam(true)}
                          className="w-full py-3 border border-white/20 text-white hover:bg-white/5 rounded-lg transition-colors font-medium"
                        >
                          Join Existing Team
                        </button>
                      </div>
                    )}

                    {myTeam && !isRegistered && (
                      <div className="mb-4">
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg mb-3">
                          <p className="text-green-400 text-sm font-medium mb-1">You are in team: {myTeam.teamName}</p>
                          <p className="text-gray-400 text-xs">
                            {myTeam.teamLeader._id === user?._id ? 'You are the leader.' : 'Member'}
                          </p>
                        </div>
                      </div>
                    )}

                    {isRegistered && (
                      <div className="w-full py-4 bg-green-500/20 text-green-400 border border-green-500/30 text-center rounded-lg mb-4 font-medium">
                        Already Registered
                      </div>
                    )}
                  </>
                )
              ) : isFull ? (
                <div className="w-full py-4 bg-red-900/40 text-red-400 border border-red-500/40 text-center rounded-lg mb-4 font-medium">
                  🚫 Event Full — No spots remaining
                </div>
              ) : (
                <div className="w-full py-4 bg-gray-700 text-center rounded-lg mb-4 cursor-not-allowed opacity-50">
                  Registration Closed
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm">
                  <Calendar className="text-disco-pink flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-medium">Event Date &amp; Time</p>
                    <p className="text-gray-400">
                      <span className="text-white/70 text-xs uppercase tracking-wide">Start:</span>{' '}
                      {formatDateTime(event.eventStartDate || event.startDate)}
                    </p>
                    {(event.eventEndDate || event.endDate) && (
                      <p className="text-gray-400">
                        <span className="text-white/70 text-xs uppercase tracking-wide">End:</span>{' '}
                        {formatDateTime(event.eventEndDate || event.endDate)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <Clock className="text-disco-pink flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-medium">Registration Deadline</p>
                    <p className="text-gray-400">{formatDateTime(event.registrationDeadline)}</p>
                  </div>
                </div>

                {event.venue && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="text-disco-pink flex-shrink-0 mt-1" size={20} />
                    <div>
                      <p className="font-medium">Venue</p>
                      <p className="text-gray-400">{event.venue}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 text-sm">
                  <Users className={`flex-shrink-0 mt-1 ${isFull ? 'text-red-400' : 'text-disco-pink'}`} size={20} />
                  <div>
                    <p className="font-medium">Capacity</p>
                    <p className={isFull ? 'text-red-400 font-semibold' : 'text-gray-400'}>
                      {event.currentRegistrations || 0} / {event.registrationLimit} registered
                      {isFull && ' · Full'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <Info className="text-disco-pink flex-shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-medium">Eligibility</p>
                    <p className="text-gray-400">{event.eligibility}</p>
                  </div>
                </div>

                {event.eventType === 'Merchandise' && (
                  <div className="flex items-start gap-3 text-sm">
                    <Package className={`flex-shrink-0 mt-1 ${(event.itemDetails?.stockQuantity || 0) <= 10
                      ? 'text-red-400'
                      : (event.itemDetails?.stockQuantity || 0) <= 25
                        ? 'text-amber-400'
                        : 'text-disco-cyan'
                      }`} size={20} />
                    <div>
                      <p className="font-medium">Stock Left</p>
                      <p className={`font-bold ${(event.itemDetails?.stockQuantity || 0) <= 10
                        ? 'text-red-400'
                        : (event.itemDetails?.stockQuantity || 0) <= 25
                          ? 'text-amber-400'
                          : 'text-disco-cyan'
                        }`}>
                        {event.itemDetails?.stockQuantity || 0} units available
                        {(event.itemDetails?.stockQuantity || 0) <= 10 && ' (Low Stock!)'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {event.eventTags?.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <p className="text-sm font-medium mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {event.eventTags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-disco-purple/20 text-disco-purple text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Organizer Info */}
            {event.organizerId && (
              <div className="bg-glass border border-white/10 rounded-2xl p-6">
                <h3 className="font-display text-lg mb-4">Organized By</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-disco flex items-center justify-center">
                    <span className="font-bold">{event.organizerId.firstName?.[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium">{event.organizerId.firstName} {event.organizerId.lastName}</p>
                    {event.contactEmail && (
                      <p className="text-sm text-gray-400">{event.contactEmail}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-white/10 rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-2xl font-display text-gradient mb-6">Complete Registration</h3>

            {event.customRegistrationForm?.length > 0 ? (
              <div className="space-y-4">
                {event.customRegistrationForm.map((field, index) => (
                  <div key={index}>
                    <label className="block text-sm font-medium mb-2">
                      {field.fieldLabel}
                      {field.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    {field.helpText && (
                      <p className="text-xs text-gray-400 mb-1">{field.helpText}</p>
                    )}
                    {field.fieldType === 'select' ? (
                      <select
                        value={formData[field.fieldLabel] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.fieldLabel]: e.target.value })}
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                        required={field.required}
                      >
                        <option value="">Select...</option>
                        {field.options?.map((opt, i) => (
                          <option key={i} value={opt.value ?? opt}>{opt.label ?? opt}</option>
                        ))}
                      </select>
                    ) : field.fieldType === 'radio' ? (
                      <div className="space-y-2">
                        {field.options?.map((opt, i) => (
                          <label key={i} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`field_${index}`}
                              value={opt.value ?? opt}
                              checked={formData[field.fieldLabel] === (opt.value ?? opt)}
                              onChange={() => setFormData({ ...formData, [field.fieldLabel]: opt.value ?? opt })}
                              required={field.required}
                            />
                            <span className="text-sm">{opt.label ?? opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : field.fieldType === 'checkbox' ? (
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!formData[field.fieldLabel]}
                          onChange={(e) => setFormData({ ...formData, [field.fieldLabel]: e.target.checked })}
                          className="w-5 h-5 rounded"
                          required={field.required && !formData[field.fieldLabel]}
                        />
                        <span className="text-sm text-gray-300">{field.placeholder || field.fieldLabel}</span>
                      </label>
                    ) : field.fieldType === 'file' ? (
                      <input
                        type="file"
                        onChange={(e) => setFormData({ ...formData, [field.fieldLabel]: e.target.files[0]?.name || '' })}
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:bg-disco-pink/20 file:text-disco-pink hover:file:bg-disco-pink/30 cursor-pointer"
                        required={field.required}
                      />
                    ) : field.fieldType === 'textarea' ? (
                      <textarea
                        value={formData[field.fieldLabel] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.fieldLabel]: e.target.value })}
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink resize-none"
                        placeholder={field.placeholder}
                        required={field.required}
                        rows={3}
                      />
                    ) : (
                      <input
                        type={field.fieldType === 'phone' ? 'tel' : (field.fieldType || 'text')}
                        value={formData[field.fieldLabel] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.fieldLabel]: e.target.value })}
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                        placeholder={field.placeholder}
                        required={field.required}
                        minLength={field.validation?.minLength}
                        maxLength={field.validation?.maxLength}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 mb-6">Confirm your registration for this event.</p>
            )}

            {/* Merchandise selection UI */}
            {event.eventType === 'Merchandise' && (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-gray-300">Select merchandise options</p>

                {event.itemDetails?.types?.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <select
                      value={itemSelection.itemType || ''}
                      onChange={(e) => setItemSelection({ ...itemSelection, itemType: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg"
                    >
                      <option value="">Select type</option>
                      {event.itemDetails.types.map((t, i) => (
                        <option key={i} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Size Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Size</label>
                  {event.itemDetails?.sizes?.length > 0 ? (
                    <select
                      value={itemSelection.size || ''}
                      onChange={(e) => setItemSelection({ ...itemSelection, size: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:border-disco-pink"
                    >
                      <option value="">Select size</option>
                      {event.itemDetails.sizes.map((s, i) => (
                        <option key={i} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-gray-400 italic">
                      Default
                    </div>
                  )}
                </div>

                {/* Color Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  {event.itemDetails?.colors?.length > 0 ? (
                    <select
                      value={itemSelection.color || ''}
                      onChange={(e) => setItemSelection({ ...itemSelection, color: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:border-disco-pink"
                    >
                      <option value="">Select color</option>
                      {event.itemDetails.colors.map((c, i) => (
                        <option key={i} value={c}>{c}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-gray-400 italic">
                      Default
                    </div>
                  )}
                </div>

                {event.itemDetails?.variants?.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Variant</label>
                    <select
                      value={itemSelection.variant || ''}
                      onChange={(e) => setItemSelection({ ...itemSelection, variant: e.target.value })}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg"
                    >
                      <option value="">Select variant</option>
                      {event.itemDetails.variants.map((v, i) => (
                        <option key={i} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    max={event.itemDetails?.purchaseLimit || event.itemDetails?.stockQuantity || 100}
                    value={itemSelection.quantity || 1}
                    onChange={(e) => setItemSelection({ ...itemSelection, quantity: Math.max(1, parseInt(e.target.value || '1', 10)) })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg"
                  />
                </div>

                <div className="text-sm text-gray-300">
                  <p>Unit price: {formatCurrency(event.itemDetails?.pricePerUnit || event.registrationFee)}</p>
                  <p className="font-medium">Total: {formatCurrency((itemSelection.quantity || 1) * (event.itemDetails?.pricePerUnit || event.registrationFee))}</p>
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowRegisterModal(false)}
                className="flex-1 px-6 py-3 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
                disabled={registering}
              >
                Cancel
              </button>
              <button
                onClick={submitRegistration}
                disabled={registering}
                className="flex-1 btn-retro py-3 disabled:opacity-50"
              >
                {registering ? 'Registering...' : 'Confirm'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <CreateTeamModal
        isOpen={showCreateTeam}
        onClose={() => setShowCreateTeam(false)}
        eventId={id}
        maxTeamSize={event.maxTeamSize}
        onTeamCreated={(team) => {
          setMyTeam(team);
          // Don't close immediately so they can copy link
        }}
      />

      <JoinTeamModal
        isOpen={showJoinTeam}
        onClose={() => setShowJoinTeam(false)}
        onTeamJoined={(team) => {
          setMyTeam(team);
          setShowJoinTeam(false);
        }}
      />
    </div>
  );
};

export default EventDetail;
