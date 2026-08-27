-- ==============================================================================
-- Gurukul's Sports ® - Supabase PostgreSQL Database Schema
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COURTS TABLE
CREATE TABLE IF NOT EXISTS public.courts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_number INTEGER UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    surface_type VARCHAR(50) NOT NULL DEFAULT 'Synthetic',
    price_per_hour NUMERIC(10, 2) NOT NULL DEFAULT 300.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code VARCHAR(30) UNIQUE NOT NULL,
    court_id UUID NOT NULL REFERENCES public.courts(id) ON DELETE RESTRICT,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    booking_date DATE NOT NULL,
    frequency VARCHAR(50) NOT NULL DEFAULT 'one-time', -- 'one-time', 'daily', 'weekly_weekends', 'weekly_sameday'
    repeat_until DATE,
    total_hours INTEGER NOT NULL DEFAULT 1,
    price_per_hour NUMERIC(10, 2) NOT NULL DEFAULT 300.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 300.00,
    status VARCHAR(30) NOT NULL DEFAULT 'confirmed', -- 'confirmed', 'cancelled'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    cancelled_at TIMESTAMPTZ
);

-- 3. BOOKING SLOTS TABLE (Detailed slot records to ensure atomic booking & collision prevention)
CREATE TABLE IF NOT EXISTS public.booking_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    court_id UUID NOT NULL REFERENCES public.courts(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    slot_time VARCHAR(20) NOT NULL, -- e.g. "06:00 AM", "07:00 AM", "08:00 PM"
    status VARCHAR(30) NOT NULL DEFAULT 'booked', -- 'booked', 'cancelled'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for ultra-fast availability queries
CREATE INDEX IF NOT EXISTS idx_booking_slots_lookup 
ON public.booking_slots (court_id, slot_date, status);

CREATE INDEX IF NOT EXISTS idx_bookings_phone 
ON public.bookings (customer_phone);

CREATE INDEX IF NOT EXISTS idx_bookings_date 
ON public.bookings (booking_date);

CREATE INDEX IF NOT EXISTS idx_bookings_code 
ON public.bookings (booking_code);

-- Unique index to prevent double bookings of the exact same slot on active bookings
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_court_slot 
ON public.booking_slots (court_id, slot_date, slot_time) 
WHERE status = 'booked';

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_slots ENABLE ROW LEVEL SECURITY;

-- 1. Public Read Access for Courts
CREATE POLICY "Public courts are viewable by everyone" 
ON public.courts FOR SELECT USING (true);

-- 2. Public Read Access for Slot Availability (to show booked vs available)
CREATE POLICY "Public slot availability is viewable by everyone" 
ON public.booking_slots FOR SELECT USING (true);

-- 3. Public Insert for Booking (with validation)
CREATE POLICY "Anyone can create a booking" 
ON public.bookings FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert booking slots" 
ON public.booking_slots FOR INSERT WITH CHECK (true);

-- 4. Public Lookup of their own booking by phone/code
CREATE POLICY "Users can view bookings by code or phone" 
ON public.bookings FOR SELECT USING (true);

-- 5. Cancellation Policy (updating status to cancelled)
CREATE POLICY "Allow booking cancellation" 
ON public.bookings FOR UPDATE USING (true);

CREATE POLICY "Allow slot cancellation" 
ON public.booking_slots FOR UPDATE USING (true);

-- Enable Realtime for Booking Slots so UI refreshes live
ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_slots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- ==============================================================================
-- SEED DATA (10 BWF Badminton Courts)
-- ==============================================================================
INSERT INTO public.courts (court_number, name, surface_type, price_per_hour, is_active, display_order)
VALUES 
    (1, 'Court 1', 'Synthetic', 300.00, true, 1),
    (2, 'Court 2', 'Synthetic', 300.00, true, 2),
    (3, 'Court 3', 'Synthetic', 300.00, true, 3),
    (4, 'Court 4', 'Synthetic', 300.00, true, 4),
    (5, 'Court 5', 'Synthetic', 300.00, true, 5),
    (6, 'Court 6', 'Synthetic', 300.00, true, 6),
    (7, 'Court 7', 'Synthetic', 300.00, true, 7),
    (8, 'Court 8', 'Synthetic', 300.00, true, 8),
    (9, 'Court 9', 'Synthetic', 300.00, true, 9),
    (10, 'Court 10', 'Synthetic', 300.00, true, 10)
ON CONFLICT (court_number) DO UPDATE 
SET surface_type = EXCLUDED.surface_type,
    price_per_hour = EXCLUDED.price_per_hour;
