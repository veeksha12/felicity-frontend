import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Calendar, MapPin, Users, DollarSign, Package, ShoppingBag, ArrowRight, Copy } from 'lucide-react';
import { eventsAPI, registrationsAPI, teamsAPI } from '../services/api';
import TeamCreationForm from '../components/TeamCreationForm';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useStore';

const EventRegistration = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [registrationError, setRegistrationError] = useState(null); // Local error state
  const [userTeam, setUserTeam] = useState(null); // User's team for this event
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState(null);

  // Merchandise selection state
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const response = await eventsAPI.getById(id);
      setEvent(response.data);

      // Check if user has a team for this event
      if (response.data.eventTags?.includes('team') || response.data.eventTags?.includes('hackathon')) {
        checkUserTeam(response.data._id);
      }

      // Check if already registered
      checkUserRegistration();

      // Set default selections for merchandise - REMOVED to force user selection
      if (response.data.eventType === 'Merchandise' && response.data.itemDetails) {
        if (!response.data.itemDetails.sizes || response.data.itemDetails.sizes.length === 0) {
          setSelectedSize('Default');
        }
        if (!response.data.itemDetails.colors || response.data.itemDetails.colors.length === 0) {
          setSelectedColor('Default');
        }
      }
    } catch (error) {
      console.error('Load event error:', error);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };



  const checkUserRegistration = async () => {
    try {
      const response = await registrationsAPI.getMyRegistrations();
      const myRegs = response.data;
      const existingReg = myRegs.find(r => r.event._id === id || r.event === id);

      if (existingReg && existingReg.status !== 'Cancelled') {
        toast.success("You are already registered for this event!");
        navigate(`/my-events`); // Or show a specific UI state
      }
    } catch (error) {
      console.error("Error checking registration:", error);
    }
  };

  const checkUserTeam = async (eventId) => {
    try {
      const response = await teamsAPI.getMyTeams();
      const team = response.data.teams.find(t => t.event._id === eventId || t.event === eventId);
      setUserTeam(team);
    } catch (error) {
      console.error('Check user team error:', error);
    }
  };

  const handleJoinTeam = async () => {
    if (!joinCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    try {
      setSubmitting(true);
      setJoinError(null);
      await teamsAPI.join({ inviteCode: joinCode });
      toast.success('Joined team successfully!');
      checkUserTeam(event._id);
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to join team';
      setJoinError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = async (formData) => {
    try {
      setSubmitting(true);

      // Validate merchandise selections
      if (event.eventType === 'Merchandise') {
        const details = event.itemDetails || {};
        if (details.sizes?.length > 0 && details.isSizeRequired !== false && !selectedSize) {
          toast.error('Please select a size');
          setRegistrationError('Size selection is required for this item.');
          return;
        }
        if (details.colors?.length > 0 && details.isColorRequired !== false && !selectedColor) {
          toast.error('Please select a color');
          setRegistrationError('Color selection is required for this item.');
          return;
        }
        if (quantity < 1) {
          toast.error('Quantity must be at least 1');
          return;
        }

        const purchaseLimit = event.itemDetails?.purchaseLimit || 1;
        if (quantity > purchaseLimit) {
          toast.error(`Maximum purchase limit is ${purchaseLimit} per person`);
          return;
        }

        if (quantity > event.itemDetails?.stockQuantity) {
          toast.error(`Only ${event.itemDetails.stockQuantity} items available in stock`);
          return;
        }
      }

      const registrationData = {
        eventId: id,
        formData: formData,
      };

      // Add merchandise selection if applicable
      if (event.eventType === 'Merchandise') {
        registrationData.itemSelection = {
          size: selectedSize,
          color: selectedColor,
          quantity: quantity,
        };
      }

      console.log('Submitting registration:', registrationData);

      const response = await registrationsAPI.register(registrationData);

      toast.success(response.data.message || 'Registration successful!');
      navigate('/my-events');
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to register for event';
      setRegistrationError(errorMessage); // Set inline error
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-disco-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-white mb-4">Event not found</h2>
          <button onClick={() => navigate('/events')} className="btn-retro">
            Browse Events
          </button>
        </div>
      </div>
    );
  }

  const isMerchandise = event.eventType === 'Merchandise';
  const isTeamEvent = !isMerchandise && (
    event.eventTags?.includes('team') ||
    event.eventTags?.includes('hackathon') ||
    event.participationType === 'Team' ||
    event.participationType === 'Both'
  );
  const stockAvailable = isMerchandise ? event.itemDetails?.stockQuantity || 0 : 0;
  const purchaseLimit = isMerchandise ? event.itemDetails?.purchaseLimit || 1 : 0;

  const { user } = useAuthStore();
  console.log('EventRegistration User State:', user);
  const isOrganizer = user?.role === 'Organizer';
  console.log('Is Organizer:', isOrganizer);

  if (isOrganizer) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <button
            onClick={() => navigate('/events')}
            className="mb-6 text-disco-pink hover:text-disco-pink/80 transition-colors"
          >
            ← Back to Events
          </button>
          <div className="bg-glass border border-white/10 rounded-2xl p-8 mb-8 text-center">
            <h1 className="text-4xl font-display text-gradient mb-4">
              {event.eventName}
            </h1>
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
              <h2 className="text-xl font-bold text-red-500 mb-2">Organizer Restricted</h2>
              <p className="text-gray-300">
                Organizers are not allowed to register for events or participate in teams.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                This account is for managing events only.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isEligible =
    event.eligibility === 'All' ||
    (event.eligibility === 'IIIT Only' && user?.participantType === 'IIIT') ||
    (event.eligibility === 'Non-IIIT Only' && user?.participantType === 'Non-IIIT');

  if (!isEligible) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <button
            onClick={() => navigate('/events')}
            className="mb-6 text-disco-pink hover:text-disco-pink/80 transition-colors"
          >
            ← Back to Events
          </button>
          <div className="bg-glass border border-white/10 rounded-2xl p-8 mb-8 text-center">
            <h1 className="text-4xl font-display text-gradient mb-4">
              {event.eventName}
            </h1>
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
              <h2 className="text-xl font-bold text-red-500 mb-2">Registration Restricted</h2>
              <p className="text-gray-300">
                This event is restricted to {event.eligibility === 'IIIT Only' ? 'IIIT Students' : 'Non-IIIT Students'} only.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Your account type ({user?.participantType}) is not eligible for this event.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <button
          onClick={() => navigate('/events')}
          className="mb-6 text-disco-pink hover:text-disco-pink/80 transition-colors"
        >
          ← Back to Events
        </button>

        <div className="bg-glass border border-white/10 rounded-2xl p-8 mb-8">
          <h1 className="text-4xl font-display text-gradient mb-4">
            {event.eventName}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar size={20} />
              <span>{new Date(event.startDate).toLocaleDateString()}</span>
            </div>

            {event.venue && (
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin size={20} />
                <span>{event.venue}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-gray-400">
              <Users size={20} />
              <span>{event.currentRegistrations || 0} / {event.registrationLimit} registered</span>
            </div>

            {event.registrationFee > 0 && (
              <div className="flex items-center gap-2 text-gray-400">
                <DollarSign size={20} />
                <span>₹{event.registrationFee}</span>
              </div>
            )}
          </div>

          <p className="text-gray-300 mb-6">{event.description}</p>

          {isTeamEvent && (
            <div className="bg-disco-cyan/10 border border-disco-cyan/20 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Users size={20} className="text-disco-cyan" />
                <span className="text-disco-cyan font-medium">Team Participation Required</span>
              </div>
              <p className="text-sm text-gray-400">
                This event requires you to join or create a team. Individual registration is not available.
              </p>
            </div>
          )}

          {isMerchandise && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag size={20} className="text-blue-300" />
                <span className="text-blue-300 font-medium">Merchandise Item</span>
              </div>
              <div className="text-sm text-gray-400">
                <p>Stock Available: <span className="text-white">{stockAvailable}</span></p>
                <p>Purchase Limit: <span className="text-white">{purchaseLimit} per person</span></p>
              </div>
            </div>
          )}
        </div>

        {/* Team Event Logic */}
        {isTeamEvent && !false ? ( // Should check checkingUserTeam loading?
          <div className="bg-glass border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-display text-disco-pink mb-6">Team Registration</h2>

            {userTeam ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                  <Users size={32} className="text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">You are already in a team!</h3>
                <p className="text-gray-400 mb-6">
                  You are a member of <span className="text-white font-bold">{userTeam.teamName}</span>.
                </p>
                {userTeam.status === 'Forming' && (
                  <div className="bg-black/40 px-6 py-4 rounded-xl border border-white/10 mb-6 inline-block">
                    <p className="text-gray-400 text-sm mb-2">Invite Code</p>
                    <div className="flex items-center gap-3">
                      <code className="text-2xl font-mono font-bold text-disco-cyan tracking-wider">
                        {userTeam.inviteCode}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(userTeam.inviteCode);
                          toast.success('Invite code copied!');
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        title="Copy Code"
                      >
                        <Copy size={20} />
                      </button>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => navigate('/my-teams')}
                  className="btn-retro"
                >
                  View My Team
                </button>
              </div>
            ) : showCreateTeam ? (
              <TeamCreationForm
                eventId={id}
                onSuccess={() => checkUserTeam(id)}
                onCancel={() => setShowCreateTeam(false)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/30 p-6 rounded-xl border border-white/10 hover:border-disco-cyan/50 transition-colors">
                  <h3 className="text-xl font-bold text-white mb-2">Create New Team</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Start a new team and invite your friends. You'll be the team leader.
                  </p>
                  <button
                    onClick={() => setShowCreateTeam(true)}
                    className="w-full btn-retro py-3"
                  >
                    Create Team
                  </button>
                </div>

                <div className="bg-black/30 p-6 rounded-xl border border-white/10 hover:border-disco-pink/50 transition-colors">
                  <h3 className="text-xl font-bold text-white mb-2">Join Existing Team</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Have an invite code? Enter it below to join your teammates.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Invite Code"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      className="flex-1 px-4 py-2 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink uppercase"
                    />
                    <button
                      onClick={handleJoinTeam}
                      disabled={submitting}
                      className="btn-retro py-2 px-4"
                    >
                      <ArrowRight size={20} />
                    </button>
                  </div>
                  {joinError && (
                    <p className="text-red-400 text-sm mt-2">{joinError}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Standard Registration Form */
          <div className="bg-glass border border-white/10 rounded-2xl p-8">
            <h2 className="text-2xl font-display text-disco-pink mb-6">
              {isMerchandise ? 'Order Details' : 'Registration Form'}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Merchandise Selection */}
              {isMerchandise && event.itemDetails && (
                <div className="space-y-6 mb-8 p-6 bg-black/30 rounded-lg border border-disco-pink/20">
                  <h3 className="text-lg font-medium text-disco-pink flex items-center gap-2">
                    <Package size={20} />
                    Item Selection
                  </h3>

                  {/* Size Selection */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium">
                      Size {event.itemDetails?.isSizeRequired !== false && <span className="text-red-400">*</span>}
                    </label>
                    {event.itemDetails.sizes && event.itemDetails.sizes.length > 0 ? (
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        {event.itemDetails.sizes.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setSelectedSize(size)}
                            className={`px-4 py-3 rounded-lg border-2 transition-all ${selectedSize === size
                              ? 'border-disco-pink bg-disco-pink/20 text-white'
                              : 'border-white/20 bg-white/5 text-gray-400 hover:border-white/40'
                              }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-gray-400 italic">
                        Default
                      </div>
                    )}
                  </div>

                  {/* Color Selection */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium">
                      Color {event.itemDetails?.isColorRequired !== false && <span className="text-red-400">*</span>}
                    </label>
                    {event.itemDetails.colors && event.itemDetails.colors.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {event.itemDetails.colors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setSelectedColor(color)}
                            className={`px-4 py-3 rounded-lg border-2 transition-all ${selectedColor === color
                              ? 'border-disco-pink bg-disco-pink/20 text-white'
                              : 'border-white/20 bg-white/5 text-gray-400 hover:border-white/40'
                              }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-gray-400 italic">
                        Default
                      </div>
                    )}
                  </div>

                  {/* Quantity Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      Quantity <span className="text-red-400">*</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-12 h-12 rounded-lg bg-white/5 hover:bg-white/10 border border-white/20 flex items-center justify-center text-xl"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Math.min(purchaseLimit, parseInt(e.target.value) || 1)))}
                        min="1"
                        max={Math.min(purchaseLimit, stockAvailable)}
                        className="w-20 text-center px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink text-xl font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(purchaseLimit, stockAvailable, quantity + 1))}
                        className="w-12 h-12 rounded-lg bg-white/5 hover:bg-white/10 border border-white/20 flex items-center justify-center text-xl"
                      >
                        +
                      </button>
                      <span className="text-sm text-gray-400">
                        (Max: {Math.min(purchaseLimit, stockAvailable)})
                      </span>
                    </div>
                  </div>

                  {/* Selection Summary */}
                  <div className="bg-disco-pink/10 border border-disco-pink/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-disco-pink mb-2">Your Selection:</h4>
                    <div className="space-y-1 text-sm">
                      {selectedSize && <p>Size: <span className="text-white">{selectedSize}</span></p>}
                      {selectedColor && <p>Color: <span className="text-white">{selectedColor}</span></p>}
                      <p>Quantity: <span className="text-white">{quantity}</span></p>
                      {event.registrationFee > 0 && (
                        <p className="text-lg font-bold mt-2 pt-2 border-t border-disco-pink/20">
                          Total: <span className="text-disco-pink">₹{event.registrationFee * quantity}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Form Fields */}
              {event.customRegistrationForm && event.customRegistrationForm.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Additional Information</h3>
                  {event.customRegistrationForm.map((field, index) => (
                    <div key={index}>
                      <label className="block text-sm font-medium mb-2">
                        {field.fieldLabel}
                        {field.required && <span className="text-red-400"> *</span>}
                      </label>
                      {field.helpText && (
                        <p className="text-xs text-gray-400 mb-1">{field.helpText}</p>
                      )}

                      {field.fieldType === 'textarea' && (
                        <textarea
                          {...register(field.fieldLabel, { required: field.required })}
                          rows={4}
                          className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                          placeholder={field.placeholder || field.fieldLabel}
                        />
                      )}

                      {(field.fieldType === 'text' || field.fieldType === 'email' || field.fieldType === 'number' || field.fieldType === 'date') && (
                        <input
                          type={field.fieldType}
                          {...register(field.fieldLabel, { required: field.required })}
                          className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                          placeholder={field.placeholder || field.fieldLabel}
                        />
                      )}

                      {field.fieldType === 'phone' && (
                        <input
                          type="tel"
                          {...register(field.fieldLabel, { required: field.required })}
                          className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                          placeholder={field.placeholder || field.fieldLabel}
                        />
                      )}

                      {field.fieldType === 'select' && (
                        <select
                          {...register(field.fieldLabel, { required: field.required })}
                          className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                        >
                          <option value="">Select {field.fieldLabel}</option>
                          {field.options?.map((opt, i) => (
                            <option key={i} value={opt.value ?? opt}>{opt.label ?? opt}</option>
                          ))}
                        </select>
                      )}

                      {field.fieldType === 'radio' && (
                        <div className="space-y-2">
                          {field.options?.map((opt, i) => (
                            <label key={i} className="flex items-center gap-2">
                              <input
                                type="radio"
                                {...register(field.fieldLabel, { required: field.required })}
                                value={opt.value ?? opt}
                                className="w-4 h-4"
                              />
                              <span>{opt.label ?? opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {field.fieldType === 'checkbox' && (
                        <div className="space-y-2">
                          {field.options && field.options.length > 0 ? (
                            field.options.map((opt, i) => (
                              <label key={i} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  {...register(`${field.fieldLabel}[${i}]`)}
                                  value={opt.value ?? opt}
                                  className="w-4 h-4"
                                />
                                <span>{opt.label ?? opt}</span>
                              </label>
                            ))
                          ) : (
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                {...register(field.fieldLabel, { required: field.required })}
                                className="w-4 h-4"
                              />
                              <span>{field.fieldLabel}</span>
                            </label>
                          )}
                        </div>
                      )}

                      {errors[field.fieldLabel] && (
                        <p className="text-red-400 text-sm mt-1">This field is required</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Error Message Display */}
              {registrationError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 flex items-center gap-3">
                  <div className="text-red-400">⚠️</div>
                  <p className="text-red-400">{registrationError}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => navigate(`/event/${id}`)}
                  className="flex-1 px-6 py-4 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || (isMerchandise && stockAvailable < 1)}
                  className="flex-1 btn-retro py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : isMerchandise ? (
                    stockAvailable < 1 ? 'Out of Stock' : `Order Now (₹${event.registrationFee * quantity})`
                  ) : event.registrationFee > 0 ? (
                    `Register (₹${event.registrationFee})`
                  ) : (
                    'Register for Free'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventRegistration;
