import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Calendar, DollarSign, Users, Info, Plus, X, ArrowUp, ArrowDown } from 'lucide-react';
import { eventsAPI } from '../services/api';
import toast from 'react-hot-toast';

const CreateEvent = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // For editing
  const [loading, setLoading] = useState(false);
  const [eventType, setEventType] = useState('Normal');
  const [eventStatus, setEventStatus] = useState('Draft');
  const [customFields, setCustomFields] = useState([]);
  const [originalData, setOriginalData] = useState(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      eventType: 'Normal',
      eligibility: 'All',
      registrationFee: 0,
      registrationLimit: 50,
      participationType: 'Individual',
      minTeamSize: 1,
      maxTeamSize: 4,
    }
  });

  const watchEventType = watch('eventType');

  useEffect(() => {
    setEventType(watchEventType);
    // If merchandise, force individual participation
    if (watchEventType === 'Merchandise') {
      setValue('participationType', 'Individual');
    }
  }, [watchEventType, setValue]);

  // Load event data if editing
  useEffect(() => {
    if (id) {
      loadEventData();
    }
  }, [id]);

  const loadEventData = async () => {
    try {
      const response = await eventsAPI.getById(id);
      const event = response.data;

      // Map backend field names to form field names and format data
      setValue('eventName', event.eventName);
      setValue('description', event.eventDescription);
      setValue('eventType', event.eventType);
      setValue('eligibility', event.eligibility);
      setValue('venue', event.venue || '');
      setValue('participationType', event.participationType || 'Individual');
      setValue('minTeamSize', event.minTeamSize || 1);
      setValue('maxTeamSize', event.maxTeamSize || 4);

      // Convert dates to datetime-local format (YYYY-MM-DDTHH:mm)
      if (event.registrationDeadline) {
        setValue('registrationDeadline', new Date(event.registrationDeadline).toISOString().slice(0, 16));
      }
      if (event.eventStartDate) {
        setValue('startDate', new Date(event.eventStartDate).toISOString().slice(0, 16));
      }
      if (event.eventEndDate) {
        setValue('endDate', new Date(event.eventEndDate).toISOString().slice(0, 16));
      }

      setValue('registrationLimit', event.registrationLimit);
      setValue('registrationFee', event.registrationFee || 0);

      // Convert eventTags array to comma-separated string
      if (event.eventTags && Array.isArray(event.eventTags)) {
        setValue('eventTags', event.eventTags.join(', '));
      }

      setEventType(event.eventType);
      setEventStatus(event.status);
      setOriginalData(event);

      // Load custom registration form fields
      if (event.customRegistrationForm && event.customRegistrationForm.length > 0) {
        setCustomFields(event.customRegistrationForm);
      }

      // Load merchandise details if applicable
      if (event.eventType === 'Merchandise' && event.merchandiseDetails) {
        if (event.merchandiseDetails.variants) {
          // Handle merchandise variants
          setValue('stockQuantity', event.merchandiseDetails.totalStockQuantity || 0);
        }
        if (event.itemDetails) {
          setValue('isSizeRequired', event.itemDetails.isSizeRequired !== false);
          setValue('isColorRequired', event.itemDetails.isColorRequired !== false);
          setValue('sizes', (event.itemDetails.sizes || []).join(', '));
          setValue('colors', (event.itemDetails.colors || []).join(', '));
          setValue('purchaseLimit', event.itemDetails.purchaseLimit || 1);
        }
      }
    } catch (error) {
      console.error('Load event error:', error);
      toast.error('Failed to load event data');
    }
  };

  const isPublished = eventStatus === 'Published';
  const isLocked = ['Ongoing', 'Completed', 'Closed', 'Cancelled'].includes(eventStatus);

  const addCustomField = () => {
    setCustomFields([...customFields, {
      fieldId: `field_${Date.now()}`,
      fieldLabel: '',
      fieldType: 'text',
      required: true,
      options: []
    }]);
  };

  const removeCustomField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateCustomField = (index, field, value) => {
    const updated = [...customFields];
    updated[index][field] = value;
    setCustomFields(updated);
  };

  const moveField = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === customFields.length - 1) return;

    const newFields = [...customFields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setCustomFields(newFields);
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      console.log('Submitting event data:', data);

      // Ensure dates are in correct format
      const eventData = {
        eventName: data.eventName,
        eventDescription: data.description,
        eventType: data.eventType,
        eligibility: data.eligibility,
        registrationDeadline: new Date(data.registrationDeadline).toISOString(),
        eventStartDate: new Date(data.startDate).toISOString(),
        eventEndDate: new Date(data.endDate).toISOString(),
        registrationLimit: parseInt(data.registrationLimit),
        registrationFee: parseFloat(data.registrationFee || 0),
        eventTags: data.eventTags ? data.eventTags.split(',').map(tag => tag.trim()) : [],
        venue: data.venue || '',
        participationType: data.participationType,
        minTeamSize: parseInt(data.minTeamSize || 1),
        maxTeamSize: parseInt(data.maxTeamSize || 1),
      };

      // Add custom form fields if any
      if (customFields.length > 0 && eventType === 'Normal') {
        eventData.customRegistrationForm = customFields.map((field, index) => ({
          fieldId: field.fieldId || `field_${Date.now()}_${index}`,
          fieldLabel: field.fieldLabel || field.label || `Field ${index + 1}`,
          fieldType: field.fieldType === 'dropdown' ? 'select' : field.fieldType,
          required: field.required !== false,
          options: Array.isArray(field.options)
            ? field.options
              .filter(o => typeof o === 'string' ? o.trim() : o.label)
              .map(o => typeof o === 'string'
                ? { label: o, value: o.trim().toLowerCase().replace(/\s+/g, '_') }
                : o)
            : [],
          order: index
        }));
      }

      // Add merchandise details if applicable
      if (eventType === 'Merchandise') {
        eventData.itemDetails = {
          sizes: data.sizes ? data.sizes.split(',').map(s => s.trim()).filter(Boolean) : [],
          colors: data.colors ? data.colors.split(',').map(c => c.trim()).filter(Boolean) : [],
          isSizeRequired: data.isSizeRequired,
          isColorRequired: data.isColorRequired,
          stockQuantity: parseInt(data.stockQuantity || 0),
          purchaseLimit: parseInt(data.purchaseLimit || 1),
        };
      }

      console.log('Formatted event data:', eventData);

      let response;
      if (id) {
        response = await eventsAPI.update(id, eventData);
        toast.success('Event updated successfully');
      } else {
        response = await eventsAPI.create(eventData);
        toast.success('Event created successfully');
      }

      console.log('API response:', response.data);
      navigate('/organizer');
    } catch (error) {
      console.error('Event creation/update error:', error);
      console.error('Error response:', error.response?.data);

      const errorMessage = error.response?.data?.message || 'Failed to save event. Please check all required fields.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-display text-gradient mb-8">
          {id ? 'Edit Event' : 'Create New Event'}
        </h1>

        <div className="bg-glass border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-2xl font-display text-disco-pink">Basic Information</h2>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Event Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  disabled={isPublished || isLocked}
                  {...register('eventName', { required: 'Event name is required' })}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink disabled:opacity-50"
                  placeholder="Enter event name"
                />
                {errors.eventName && (
                  <p className="text-red-400 text-sm mt-1">{errors.eventName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  {...register('description', { required: 'Description is required' })}
                  rows={4}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                  placeholder="Describe your event"
                />
                {errors.description && (
                  <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Event Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    disabled={isPublished || isLocked}
                    {...register('eventType', { required: true })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink disabled:opacity-50"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Merchandise">Merchandise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Eligibility <span className="text-red-400">*</span>
                  </label>
                  <select
                    disabled={isPublished || isLocked}
                    {...register('eligibility', { required: true })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink disabled:opacity-50"
                  >
                    <option value="All">All</option>
                    <option value="IIIT Only">IIIT Only</option>
                    <option value="Non-IIIT Only">Non-IIIT Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Multiple Participants <span className="text-red-400">*</span>
                  </label>
                  <select
                    disabled={isPublished || isLocked}
                    {...register('participationType', { required: true })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink disabled:opacity-50"
                  >
                    <option value="Individual">Individual Only</option>
                    {watchEventType !== 'Merchandise' && (
                      <>
                        <option value="Team">Team Only</option>
                        <option value="Both">Individual & Team</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Team Settings - Only show if Team or Both */}
            {(watch('participationType') === 'Team' || watch('participationType') === 'Both') && (
              <div className="grid grid-cols-2 gap-4 bg-disco-purple/10 p-4 rounded-lg border border-disco-purple/20">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Min Team Size <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    disabled={isPublished || isLocked}
                    {...register('minTeamSize', {
                      required: 'Min team size is required',
                      min: { value: 1, message: 'Must be at least 1' }
                    })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink disabled:opacity-50"
                  />
                  {errors.minTeamSize && (
                    <p className="text-red-400 text-sm mt-1">{errors.minTeamSize.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Max Team Size <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    disabled={isPublished || isLocked}
                    {...register('maxTeamSize', {
                      required: 'Max team size is required',
                      min: { value: 1, message: 'Must be at least 1' },
                      validate: (value) =>
                        parseInt(value) >= parseInt(watch('minTeamSize') || 0) ||
                        'Max size must be greater than or equal to min size'
                    })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink disabled:opacity-50"
                  />
                  {errors.maxTeamSize && (
                    <p className="text-red-400 text-sm mt-1">{errors.maxTeamSize.message}</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Venue</label>
              <input
                type="text"
                {...register('venue')}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                placeholder="Event venue (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Event Tags (comma-separated)
              </label>
              <input
                type="text"
                {...register('eventTags')}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                placeholder="e.g., workshop, tech, coding"
              />
            </div>

            {/* Dates & Registration */}
            <div className="space-y-6">
              <h2 className="text-2xl font-display text-disco-pink">Dates & Registration</h2>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Registration Deadline <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    {...register('registrationDeadline', {
                      required: 'Registration deadline is required',
                      validate: (value) => {
                        if (isPublished) {
                          const newDeadline = new Date(value);
                          const currentDeadline = new Date(originalData.registrationDeadline);
                          if (newDeadline < currentDeadline) return 'Deadline can only be extended.';
                        }
                        return true;
                      }
                    })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                  />
                  {errors.registrationDeadline && (
                    <p className="text-red-400 text-sm mt-1">{errors.registrationDeadline.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Start Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    disabled={isPublished || isLocked}
                    {...register('startDate', { required: 'Start date is required' })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink disabled:opacity-50"
                  />
                  {errors.startDate && (
                    <p className="text-red-400 text-sm mt-1">{errors.startDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    End Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    disabled={isPublished || isLocked}
                    {...register('endDate', { required: 'End date is required' })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink disabled:opacity-50"
                  />
                  {errors.endDate && (
                    <p className="text-red-400 text-sm mt-1">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Registration Limit <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    {...register('registrationLimit', {
                      required: 'Registration limit is required',
                      min: { value: 1, message: 'Must be at least 1' },
                      validate: (value) => {
                        if (isPublished) {
                          if (parseInt(value) < originalData.registrationLimit) return 'Limit can only be increased.';
                        }
                        return true;
                      }
                    })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                    placeholder="50"
                  />
                  {errors.registrationLimit && (
                    <p className="text-red-400 text-sm mt-1">{errors.registrationLimit.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Registration Fee (₹)
                  </label>
                  <input
                    type="number"
                    disabled={isPublished || isLocked}
                    {...register('registrationFee', { min: 0 })}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink disabled:opacity-50"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Merchandise Details */}
            {
              eventType === 'Merchandise' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-display text-disco-pink">Merchandise Details</h2>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium">Available Sizes</label>
                        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                          <input type="checkbox" disabled={isPublished || isLocked} {...register('isSizeRequired')} className="rounded" />
                          Required
                        </label>
                      </div>
                      <input
                        type="text"
                        disabled={isPublished || isLocked}
                        {...register('sizes')}
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink disabled:opacity-50"
                        placeholder="S, M, L, XL, XXL"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium">Available Colors</label>
                        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                          <input type="checkbox" disabled={isPublished || isLocked} {...register('isColorRequired')} className="rounded" />
                          Required
                        </label>
                      </div>
                      <input
                        type="text"
                        disabled={isPublished || isLocked}
                        {...register('colors')}
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink disabled:opacity-50"
                        placeholder="Black, White, Navy"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Stock Quantity <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        {...register('stockQuantity', {
                          required: eventType === 'Merchandise' ? 'Stock quantity is required' : false,
                          min: { value: 0, message: 'Cannot be negative' }
                        })}
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                        placeholder="100"
                      />
                      {errors.stockQuantity && (
                        <p className="text-red-400 text-sm mt-1">{errors.stockQuantity.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Purchase Limit per Person
                      </label>
                      <input
                        type="number"
                        {...register('purchaseLimit', { min: 1 })}
                        className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                        placeholder="1"
                      />
                    </div>
                  </div>
                </div>
              )
            }

            {/* Custom Form Fields */}
            {
              eventType === 'Normal' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-display text-disco-pink">Custom Registration Fields</h2>
                    <button
                      type="button"
                      disabled={isPublished || isLocked}
                      onClick={addCustomField}
                      className="px-4 py-2 bg-disco-pink/20 hover:bg-disco-pink/30 text-disco-pink rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} />
                      Add Field
                    </button>
                  </div>

                  {customFields.map((field, index) => (
                    <div key={index} className="bg-black/30 p-4 rounded-lg space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-400">Field {index + 1}</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => moveField(index, 'up')}
                              disabled={index === 0}
                              className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:text-white"
                              title="Move Up"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveField(index, 'down')}
                              disabled={index === customFields.length - 1}
                              className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed text-gray-400 hover:text-white"
                              title="Move Down"
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={isPublished || isLocked}
                          onClick={() => removeCustomField(index)}
                          className="text-red-400 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Remove Field"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Label</label>
                          <input
                            type="text"
                            value={field.fieldLabel || ''}
                            onChange={(e) => updateCustomField(index, 'fieldLabel', e.target.value)}
                            className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                            placeholder="e.g. T-Shirt Size, College Name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Type</label>
                          <select
                            value={field.fieldType}
                            onChange={(e) => updateCustomField(index, 'fieldType', e.target.value)}
                            className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                          >
                            <option value="text">Text</option>
                            <option value="select">Dropdown</option>
                            <option value="file">File Upload</option>
                            <option value="checkbox">Checkbox</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={field.required !== false}
                            onChange={(e) => updateCustomField(index, 'required', e.target.checked)}
                            className="rounded border-white/20"
                          />
                          Required Field
                        </label>
                      </div>

                      {field.fieldType === 'select' && (
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Options (comma-separated) <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={field.optionsRaw !== undefined
                              ? field.optionsRaw
                              : (Array.isArray(field.options)
                                ? field.options.map(o => typeof o === 'string' ? o : o.label).join(', ')
                                : '')}
                            onChange={(e) => updateCustomField(index, 'optionsRaw', e.target.value)}
                            onBlur={(e) => {
                              const parsed = e.target.value.split(',').map(o => o.trim()).filter(Boolean);
                              updateCustomField(index, 'options', parsed);
                            }}
                            className="w-full px-4 py-2 bg-black/50 border border-white/10 rounded-lg focus:outline-none focus:border-disco-pink"
                            placeholder="e.g. S, M, L, XL"
                          />
                        </div>
                      )}
                      {field.fieldType === 'checkbox' && (
                        <p className="text-xs text-gray-400">This will appear as a single tick box participants can check or uncheck.</p>
                      )}
                      {field.fieldType === 'file' && (
                        <p className="text-xs text-gray-400">Participants will see a file picker to upload a document or image.</p>
                      )}


                    </div>
                  ))}

                  {customFields.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-4">
                      No custom fields added. Click "Add Field" to create registration form fields.
                    </p>
                  )}
                </div>
              )
            }

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/organizer')}
                className="flex-1 px-6 py-4 border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-retro py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {id ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  id ? 'Update Event' : 'Create Event'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
