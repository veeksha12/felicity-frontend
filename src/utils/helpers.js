export const formatDate = (date, format = 'PPP') => {
  if (!date) return '';
  const dateObj = new Date(date);

  if (format === 'PPP') {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  if (format === 'MMM dd') {
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  return dateObj.toLocaleDateString();
};

export const formatDateTime = (date) => {
  if (!date) return '';
  const dateObj = new Date(date);

  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Currency formatting - FIXED to handle undefined/null
export const formatCurrency = (amount) => {
  // Handle undefined, null, or empty values
  if (amount === undefined || amount === null || amount === '') {
    return 'Free';
  }

  // Convert to number if it's a string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  // Check if it's a valid number
  if (isNaN(numAmount)) {
    return 'Free';
  }

  // Check if it's zero or negative
  if (numAmount <= 0) {
    return 'Free';
  }

  // Format as currency
  return `₹${numAmount.toLocaleString('en-IN')}`;
};

// Time utilities
export const getTimeUntilEvent = (targetDate) => {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
};

// Event status utilities
export const isEventPast = (date) => {
  return new Date(date) < new Date();
};

export const isEventUpcoming = (event) => {
  const now = new Date();
  const startDate = new Date(event.eventStartDate || event.startDate);

  return startDate > now;
};

export const isEventOngoing = (event) => {
  const now = new Date();
  const startDate = new Date(event.eventStartDate || event.startDate);
  const endDate = new Date(event.eventEndDate || event.endDate);

  return startDate <= now && endDate >= now;
};

export const isEventCompleted = (event) => {
  const now = new Date();
  const endDate = new Date(event.eventEndDate || event.endDate);

  return endDate < now;
};

export const getEventStatus = (event) => {
  if (event.status) return event.status.toLowerCase();

  if (isEventCompleted(event)) return 'completed';
  if (isEventOngoing(event)) return 'ongoing';
  if (isEventUpcoming(event)) return 'upcoming';
  return 'unknown';
};

export const getEventStatusColor = (status) => {
  const statusColors = {
    'published': 'bg-green-500',
    'ongoing': 'bg-blue-500',
    'completed': 'bg-indigo-500',
    'closed': 'bg-orange-500',
    'cancelled': 'bg-red-500',
    'draft': 'bg-gray-500',
    'upcoming': 'bg-green-500',
  };

  return statusColors[status.toLowerCase()] || 'bg-gray-500';
};

// Validation utilities
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateIIITEmail = (email) => {
  return email.endsWith('@students.iiit.ac.in') || email.endsWith('@research.iiit.ac.in');
};

// String utilities
export const truncate = (str, length = 100) => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};

export const slugify = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};