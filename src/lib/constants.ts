export const SERVICE_CONFIG = {
  wash_fold: {
    name: 'Wash & Fold',
    price: 60,
    duration: 120,
    icon: 'Shirt',
    unit: 'per kg',
  },
  dry_clean: {
    name: 'Dry Cleaning',
    price: 150,
    duration: 180,
    icon: 'Sparkles',
    unit: 'per piece',
  },
  ironing: {
    name: 'Ironing/Pressing',
    price: 30,
    duration: 60,
    icon: 'Flame',
    unit: 'per piece',
  },
  wash_only: {
    name: 'Wash Only',
    price: 40,
    duration: 90,
    icon: 'Droplets',
    unit: 'per kg',
  },
  dry_only: {
    name: 'Dry Only',
    price: 35,
    duration: 60,
    icon: 'Wind',
    unit: 'per kg',
  },
  express: {
    name: 'Express Service',
    price: 100,
    duration: 60,
    icon: 'Zap',
    unit: 'per kg',
  },
  bedding: {
    name: 'Bedding/Comforter',
    price: 250,
    duration: 240,
    icon: 'BedDouble',
    unit: 'per piece',
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
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00',
];
