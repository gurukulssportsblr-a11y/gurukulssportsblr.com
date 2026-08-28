-- ==============================================================================
-- GURUKUL'S SPORTS ® - COMPLETE SUPABASE SETUP SCRIPT
-- Copy and paste this ENTIRE script into your Supabase SQL Editor and click RUN
-- ==============================================================================

-- Enable UUID extension
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
    frequency VARCHAR(50) NOT NULL DEFAULT 'one-time',
    repeat_until DATE,
    total_hours INTEGER NOT NULL DEFAULT 1,
    price_per_hour NUMERIC(10, 2) NOT NULL DEFAULT 300.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 300.00,
    status VARCHAR(30) NOT NULL DEFAULT 'confirmed', -- 'confirmed', 'cancelled'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    cancelled_at TIMESTAMPTZ
);

-- 3. BOOKING SLOTS TABLE
CREATE TABLE IF NOT EXISTS public.booking_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    court_id UUID NOT NULL REFERENCES public.courts(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    slot_time VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'booked', -- 'booked', 'cancelled'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. PRICING RULES TABLE
CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(150) NOT NULL,
    start_hour INTEGER NOT NULL,
    end_hour INTEGER NOT NULL,
    price_per_hour NUMERIC(10, 2) NOT NULL DEFAULT 200.00,
    court_scope VARCHAR(50) NOT NULL DEFAULT 'ALL',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. BLOCKED COURTS TABLE
CREATE TABLE IF NOT EXISTS public.blocked_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_number INTEGER NOT NULL,
    block_date DATE NOT NULL,
    start_hour INTEGER NOT NULL,
    end_hour INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL DEFAULT 'Court Maintenance',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.site_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_booking_slots_lookup ON public.booking_slots (court_id, slot_date, status);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON public.bookings (customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings (booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_code ON public.bookings (booking_code);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_date ON public.blocked_slots (block_date);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid duplicates
DROP POLICY IF EXISTS "Public courts are viewable by everyone" ON public.courts;
DROP POLICY IF EXISTS "Allow courts management" ON public.courts;
DROP POLICY IF EXISTS "Public slot availability is viewable by everyone" ON public.booking_slots;
DROP POLICY IF EXISTS "Anyone can create a booking" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can insert booking slots" ON public.booking_slots;
DROP POLICY IF EXISTS "Users can view bookings by code or phone" ON public.bookings;
DROP POLICY IF EXISTS "Allow booking cancellation" ON public.bookings;
DROP POLICY IF EXISTS "Allow slot cancellation" ON public.booking_slots;
DROP POLICY IF EXISTS "Allow bookings all" ON public.bookings;
DROP POLICY IF EXISTS "Allow booking slots all" ON public.booking_slots;
DROP POLICY IF EXISTS "Public can view pricing rules" ON public.pricing_rules;
DROP POLICY IF EXISTS "Allow admin manage pricing rules" ON public.pricing_rules;
DROP POLICY IF EXISTS "Public can view blocked slots" ON public.blocked_slots;
DROP POLICY IF EXISTS "Allow admin manage blocked slots" ON public.blocked_slots;
DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admin manage site settings" ON public.site_settings;

-- Allow full public operations with validation
CREATE POLICY "Public courts are viewable by everyone" ON public.courts FOR SELECT USING (true);
CREATE POLICY "Allow courts management" ON public.courts FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow bookings all" ON public.bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow booking slots all" ON public.booking_slots FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow admin manage pricing rules" ON public.pricing_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin manage blocked slots" ON public.blocked_slots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow admin manage site settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_slots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pricing_rules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_slots;

-- ==============================================================================
-- SEED ALL 11 BWF SYNTHETIC COURTS
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
    (10, 'Court 10', 'Synthetic', 300.00, true, 10),
    (11, 'Court 11', 'Synthetic', 300.00, true, 11)
ON CONFLICT (court_number) DO UPDATE 
SET name = EXCLUDED.name,
    surface_type = EXCLUDED.surface_type,
    price_per_hour = EXCLUDED.price_per_hour,
    is_active = true;
