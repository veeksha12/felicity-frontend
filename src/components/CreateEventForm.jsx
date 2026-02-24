import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Calendar,
  Users,
  DollarSign,
  Tag,
  FileText,
  Plus,
  Trash2,
  MapPin,
  Link as LinkIcon,
  Image as ImageIcon
} from 'lucide-react';
import axios from 'axios';

const CreateEventForm = ({ eventType = 'Normal', onSuccess }) => {
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      eventName: '',
      eventDescription: '',
      eventType: eventType,
      eligibility: 'All',
      registrationDeadline: '',
      eventStartDate: '',
      eventEndDate: '',
      registrationLimit: 100,
      registrationFee: 0,
      eventTags: [''],
      venue: '',
      eventMode: 'Offline',
      eventLink: '',
      posterImage: '',
      status: 'Draft',
      // Normal event fields
      customRegistrationForm: eventType === 'Normal' ? [
        { fieldId: 'field_1', fieldLabel: 'Full Name', fieldType: 'text', required: true, order: 1, options: [] }
      ] : [],
      // Merchandise event fields
      merchandiseDetails: eventType === 'Merchandise' ? {
        variants: [
          { variantId: 'var_1', size: 'M', color: 'Black', stockQuantity: 50, price: 0 }
        ],
        purchaseLimitPerParticipant: 5,
        allowMultipleVariants: true
      } : {}
    }
  });

  // Field arrays for dynamic forms
  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
    control,
    name: 'eventTags'
  });

  const { fields: formFields, append: appendFormField, remove: removeFormField } = useFieldArray({
    control,
    name: 'customRegistrationForm'
  });

  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: 'merchandiseDetails.variants'
  });

  const watchEventType = watch('eventType');
  const watchedFormFields = watch('customRegistrationForm');

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      // Clean up tags (remove empty ones)
      data.eventTags = data.eventTags.filter(tag => tag.trim() !== '');

      if (data.eventTags.length === 0) {
        setMessage({ type: 'error', text: 'At least one event tag is required' });
        setIsSubmitting(false);
        return;
      }

      // Generate unique IDs for form fields if Normal event
      if (data.eventType === 'Normal') {
        data.customRegistrationForm = data.customRegistrationForm.map((field, index) => ({
          ...field,
          fieldId: field.fieldId || `field_${Date.now()}_${index}`,
          order: index,
          // Normalize options: ensure value is always set from label
          options: (field.options || []).map((opt, i) => ({
            label: opt.label || `Option ${i + 1}`,
            value: opt.value || (opt.label || `option_${i + 1}`).trim().toLowerCase().replace(/\s+/g, '_')
          }))
        }));
      }

      // Generate unique IDs for variants if Merchandise event
      if (data.eventType === 'Merchandise') {
        data.merchandiseDetails.variants = data.merchandiseDetails.variants.map((variant, index) => ({
          ...variant,
          variantId: variant.variantId || `var_${Date.now()}_${index}`,
          price: variant.price || data.registrationFee // Use base fee if not specified
        }));
      }

      const token = localStorage.getItem('token');
      const response = await axios.post('/api/events', data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage({
        type: 'success',
        text: `Event "${data.eventName}" created successfully!`
      });

      if (onSuccess) {
        onSuccess(response.data.event);
      }

      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error('Error creating event:', error);

      const errorMessage = error.response?.data?.message ||
        error.response?.data?.errors?.join(', ') ||
        'Failed to create event';

      setMessage({ type: 'error', text: errorMessage });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formFieldTypes = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Number' },
    { value: 'phone', label: 'Phone' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'select', label: 'Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'date', label: 'Date' },
    { value: 'file', label: 'File Upload' }
  ];

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Create {watchEventType} Event
        </h1>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
              }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

          {/* ============================================ */}
          {/* BASIC INFORMATION */}
          {/* ============================================ */}

          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
              Basic Information
            </h2>

            {/* Event Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('eventName', {
                  required: 'Event name is required',
                  minLength: { value: 3, message: 'Event name must be at least 3 characters' },
                  maxLength: { value: 200, message: 'Event name cannot exceed 200 characters' }
                })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.eventName ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="E.g., Web Development Workshop, Tech T-Shirt Sale"
              />
              {errors.eventName && (
                <p className="mt-1 text-sm text-red-600">{errors.eventName.message}</p>
              )}
            </div>

            {/* Event Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Description <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  {...register('eventDescription', {
                    required: 'Event description is required',
                    minLength: { value: 20, message: 'Description must be at least 20 characters' },
                    maxLength: { value: 5000, message: 'Description cannot exceed 5000 characters' }
                  })}
                  rows={5}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.eventDescription ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Provide detailed information about the event, what participants will learn or receive, requirements, etc."
                />
              </div>
              {errors.eventDescription && (
                <p className="mt-1 text-sm text-red-600">{errors.eventDescription.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">Minimum 20 characters, maximum 5000</p>
            </div>

            {/* Event Type (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={watchEventType}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
              />
              <p className="mt-1 text-sm text-gray-500">
                {watchEventType === 'Normal'
                  ? 'Individual registration with custom form'
                  : 'Individual merchandise purchase'}
              </p>
            </div>

            {/* Eligibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eligibility <span className="text-red-500">*</span>
              </label>
              <select
                {...register('eligibility', { required: 'Eligibility is required' })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.eligibility ? 'border-red-500' : 'border-gray-300'
                  }`}
              >
                <option value="All">All Participants</option>
                <option value="IIIT Only">IIIT Students Only</option>
                <option value="Non-IIIT Only">Non-IIIT Participants Only</option>
              </select>
              {errors.eligibility && (
                <p className="mt-1 text-sm text-red-600">{errors.eligibility.message}</p>
              )}
            </div>
          </section>

          {/* ============================================ */}
          {/* DATES AND CAPACITY */}
          {/* ============================================ */}

          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
              Dates & Capacity
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Registration Deadline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Deadline <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="datetime-local"
                    {...register('registrationDeadline', {
                      required: 'Registration deadline is required'
                    })}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.registrationDeadline ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                </div>
                {errors.registrationDeadline && (
                  <p className="mt-1 text-sm text-red-600">{errors.registrationDeadline.message}</p>
                )}
              </div>

              {/* Event Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="datetime-local"
                    {...register('eventStartDate', {
                      required: 'Event start date is required'
                    })}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.eventStartDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                </div>
                {errors.eventStartDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.eventStartDate.message}</p>
                )}
              </div>

              {/* Event End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event End Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="datetime-local"
                    {...register('eventEndDate', {
                      required: 'Event end date is required'
                    })}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.eventEndDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                </div>
                {errors.eventEndDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.eventEndDate.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Registration Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Limit <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    {...register('registrationLimit', {
                      required: 'Registration limit is required',
                      min: { value: 1, message: 'Must be at least 1' },
                      valueAsNumber: true
                    })}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.registrationLimit ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="100"
                  />
                </div>
                {errors.registrationLimit && (
                  <p className="mt-1 text-sm text-red-600">{errors.registrationLimit.message}</p>
                )}
              </div>

              {/* Registration Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Fee (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    {...register('registrationFee', {
                      required: 'Registration fee is required',
                      min: { value: 0, message: 'Cannot be negative' },
                      valueAsNumber: true
                    })}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.registrationFee ? 'border-red-500' : 'border-gray-300'
                      }`}
                    placeholder="0"
                  />
                </div>
                {errors.registrationFee && (
                  <p className="mt-1 text-sm text-red-600">{errors.registrationFee.message}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">Enter 0 for free events</p>
              </div>
            </div>
          </section>

          {/* ============================================ */}
          {/* EVENT TAGS */}
          {/* ============================================ */}

          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
              Event Tags <span className="text-red-500">*</span>
            </h2>

            {tagFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <div className="flex-1 relative">
                  <Tag className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    {...register(`eventTags.${index}`)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="E.g., Workshop, Technical, Beginner-Friendly"
                  />
                </div>
                {tagFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={() => appendTag('')}
              className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
            >
              <Plus className="h-5 w-5" />
              Add Tag
            </button>
            <p className="text-sm text-gray-500">At least one tag is required. Tags help participants find your event.</p>
          </section>

          {/* ============================================ */}
          {/* NORMAL EVENT: CUSTOM REGISTRATION FORM */}
          {/* ============================================ */}

          {watchEventType === 'Normal' && (
            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                Custom Registration Form <span className="text-red-500">*</span>
              </h2>
              <p className="text-sm text-gray-600">
                Define the fields participants need to fill when registering for this event
              </p>

              {formFields.map((field, index) => {
                const currentFieldType = watchedFormFields?.[index]?.fieldType;
                const currentOptions = watchedFormFields?.[index]?.options || [];
                const needsOptions = ['select', 'radio', 'checkbox'].includes(currentFieldType);

                return (
                  <div key={field.id} className="p-4 border border-gray-200 rounded-lg space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-gray-700">Field {index + 1}</h3>
                      {formFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFormField(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Field Label <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          {...register(`customRegistrationForm.${index}.fieldLabel`, {
                            required: 'Field label is required'
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="E.g., Phone Number, College Name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Field Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          {...register(`customRegistrationForm.${index}.fieldType`, {
                            required: 'Field type is required'
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {formFieldTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Placeholder
                        </label>
                        <input
                          type="text"
                          {...register(`customRegistrationForm.${index}.placeholder`)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="E.g., Enter your phone number"
                        />
                      </div>

                      <div className="flex items-center pt-6">
                        <input
                          type="checkbox"
                          {...register(`customRegistrationForm.${index}.required`)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm font-medium text-gray-700">
                          Required Field
                        </label>
                      </div>
                    </div>

                    {/* Options editor for select / radio / checkbox */}
                    {needsOptions && (
                      <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Options <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-gray-500 mb-2">Add the choices participants will see.</p>
                        {currentOptions.map((opt, optIdx) => (
                          <div key={optIdx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={opt.label || ''}
                              onChange={(e) => {
                                const label = e.target.value;
                                const value = label.trim().toLowerCase().replace(/\s+/g, '_') || `option_${optIdx + 1}`;
                                const newOptions = currentOptions.map((o, i) =>
                                  i === optIdx ? { label, value } : o
                                );
                                setValue(`customRegistrationForm.${index}.options`, newOptions, { shouldValidate: false });
                              }}
                              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder={`Option ${optIdx + 1} (e.g. Yes, No, Maybe)`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newOptions = currentOptions.filter((_, i) => i !== optIdx);
                                setValue(`customRegistrationForm.${index}.options`, newOptions, { shouldValidate: false });
                              }}
                              className="text-red-500 hover:text-red-700 flex-shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const newOptions = [...currentOptions, { label: '', value: '' }];
                            setValue(`customRegistrationForm.${index}.options`, newOptions, { shouldValidate: false });
                          }}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-1"
                        >
                          <Plus className="h-4 w-4" /> Add Option
                        </button>
                        {currentOptions.length === 0 && (
                          <p className="text-xs text-red-500 mt-1">⚠ At least one option is required for this field type.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => appendFormField({
                  fieldId: `field_${Date.now()}`,
                  fieldLabel: '',
                  fieldType: 'text',
                  required: false,
                  options: []
                })}
                className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
              >
                <Plus className="h-5 w-5" />
                Add Form Field
              </button>
            </section>
          )}

          {/* ============================================ */}
          {/* MERCHANDISE EVENT: VARIANTS */}
          {/* ============================================ */}

          {watchEventType === 'Merchandise' && (
            <section className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
                Merchandise Variants <span className="text-red-500">*</span>
              </h2>

              {variantFields.map((field, index) => (
                <div key={field.id} className="p-4 border border-gray-200 rounded-lg space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-700">Variant {index + 1}</h3>
                    {variantFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Size
                      </label>
                      <input
                        type="text"
                        {...register(`merchandiseDetails.variants.${index}.size`)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="S, M, L, XL"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color
                      </label>
                      <input
                        type="text"
                        {...register(`merchandiseDetails.variants.${index}.color`)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Black, White, Red"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stock Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        {...register(`merchandiseDetails.variants.${index}.stockQuantity`, {
                          required: 'Stock quantity is required',
                          min: { value: 0, message: 'Cannot be negative' },
                          valueAsNumber: true
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        {...register(`merchandiseDetails.variants.${index}.price`, {
                          min: { value: 0, message: 'Cannot be negative' },
                          valueAsNumber: true
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Uses base fee if empty"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => appendVariant({
                  variantId: `var_${Date.now()}`,
                  size: '',
                  color: '',
                  stockQuantity: 0,
                  price: 0
                })}
                className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
              >
                <Plus className="h-5 w-5" />
                Add Variant
              </button>

              {/* Purchase Limit */}
              <div className="pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purchase Limit Per Participant <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  {...register('merchandiseDetails.purchaseLimitPerParticipant', {
                    required: 'Purchase limit is required',
                    min: { value: 1, message: 'Must be at least 1' },
                    valueAsNumber: true
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="5"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Maximum number of items one participant can purchase
                </p>
              </div>
            </section>
          )}

          {/* ============================================ */}
          {/* OPTIONAL DETAILS */}
          {/* ============================================ */}

          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
              Optional Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Venue */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    {...register('venue')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="E.g., Auditorium, Online"
                  />
                </div>
              </div>

              {/* Event Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Mode
                </label>
                <select
                  {...register('eventMode')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Offline">Offline</option>
                  <option value="Online">Online</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              {/* Event Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Link (for online/hybrid events)
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    {...register('eventLink')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              </div>

              {/* Poster Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Poster Image URL
                </label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    {...register('posterImage')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              onClick={() => register('status').onChange({ target: { value: 'Published' } })}
              disabled={isSubmitting}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
            >
              {isSubmitting ? 'Creating...' : 'Create & Publish Event'}
            </button>

            <button
              type="submit"
              onClick={() => register('status').onChange({ target: { value: 'Draft' } })}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Save as Draft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventForm;