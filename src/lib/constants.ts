export const SERVICE_CONFIG = {
  basic_haircut: {
    name: 'Basic Haircut',
    price: 150,
    duration: 30,
    icon: 'Scissors',
  },
  premium_haircut: {
    name: 'Premium Haircut',
    price: 250,
    duration: 45,
    icon: 'Crown',
  },
  beard_trim: {
    name: 'Beard Trim',
    price: 100,
    duration: 20,
    icon: 'Sparkles',
  },
  shave: {
    name: 'Shave',
    price: 120,
    duration: 25,
    icon: 'Slash',
  },
  hair_color: {
    name: 'Hair Color',
    price: 500,
    duration: 90,
    icon: 'Palette',
  },
  styling: {
    name: 'Styling',
    price: 200,
    duration: 40,
    icon: 'Wand2',
  },
} as const;

export type ServiceType = keyof typeof SERVICE_CONFIG;

export const PAYMENT_METHODS = {
  gcash: { name: 'GCash', icon: 'Smartphone' },
  cash: { name: 'Cash', icon: 'Banknote' },
  card: { name: 'Card', icon: 'CreditCard' },
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

export const BOOKING_STATUS_CONFIG = {
  pending: { label: 'Pending', className: 'status-pending' },
  confirmed: { label: 'Confirmed', className: 'status-confirmed' },
  in_progress: { label: 'In Progress', className: 'status-in-progress' },
  completed: { label: 'Completed', className: 'status-completed' },
  cancelled: { label: 'Cancelled', className: 'status-cancelled' },
} as const;

export type BookingStatus = keyof typeof BOOKING_STATUS_CONFIG;

export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00',
];
