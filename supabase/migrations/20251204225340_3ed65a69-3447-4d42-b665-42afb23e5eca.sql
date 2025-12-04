-- Drop existing service_type enum and recreate for laundry
ALTER TABLE public.bookings DROP COLUMN service_type;
DROP TYPE IF EXISTS public.service_type;

CREATE TYPE public.service_type AS ENUM ('wash_fold', 'dry_clean', 'ironing', 'wash_only', 'dry_only', 'express', 'bedding');

ALTER TABLE public.bookings ADD COLUMN service_type public.service_type NOT NULL DEFAULT 'wash_fold';

-- Update sample branches for laundry
UPDATE public.branches SET 
  name = 'Downtown Laundry',
  address = '123 Main Street, Downtown'
WHERE name = 'Downtown Branch';

UPDATE public.branches SET 
  name = 'Mall of Asia Laundry',
  address = 'SM Mall of Asia, Pasay City'
WHERE name = 'Mall of Asia Branch';

UPDATE public.branches SET 
  name = 'Makati Laundry Hub',
  address = '456 Ayala Avenue, Makati City'
WHERE name = 'Makati Branch';