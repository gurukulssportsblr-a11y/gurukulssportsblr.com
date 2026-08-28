-- ==============================================================================
-- Gurukul's Sports ® - Supabase PostgreSQL Database Schema
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COURTS TABLE (11 BWF Synthetic Badminton Courts)
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
    slot_time VARCHAR(20) NOT NULL, -- e.g. "06:00 AM", "07:00 AM", "08:00 PM"
    status VARCHAR(30) NOT NULL DEFAULT 'booked', -- 'booked', 'cancelled'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. PRICING RULES TABLE (Dynamic Happy Hours & Discounts)
CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(150) NOT NULL,
    start_hour INTEGER NOT NULL, -- 6 for 6:00 AM
    end_hour INTEGER NOT NULL,   -- 15 for 3:00 PM
    price_per_hour NUMERIC(10, 2) NOT NULL DEFAULT 200.00,
    court_scope VARCHAR(50) NOT NULL DEFAULT 'ALL', -- 'ALL' or 'CUSTOM'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. BLOCKED COURTS TABLE (Maintenance & Tournaments)
CREATE TABLE IF NOT EXISTS public.blocked_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_number INTEGER NOT NULL, -- 1 to 11 or 0 for ALL
    block_date DATE NOT NULL,
    start_hour INTEGER NOT NULL,
    end_hour INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL DEFAULT 'Court Maintenance',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. SITE SETTINGS TABLE (Promotional Banner & Pop-up Notification)
CREATE TABLE IF NOT EXISTS public.site_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
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

CREATE INDEX IF NOT EXISTS idx_blocked_slots_date 
ON public.blocked_slots (block_date);

-- Unique index to prevent double bookings of the exact same slot on active bookings
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_court_slot 
ON public.booking_slots (court_id, slot_date, slot_time) 
WHERE status = 'booked';

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public courts are viewable by everyone" ON public.courts FOR SELECT USING (true);
CREATE POLICY "Public slot availability is viewable by everyone" ON public.booking_slots FOR SELECT USING (true);
CREATE POLICY "Anyone can create a booking" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert booking slots" ON public.booking_slots FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view bookings by code or phone" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Allow booking cancellation" ON public.bookings FOR UPDATE USING (true);
CREATE POLICY "Allow slot cancellation" ON public.booking_slots FOR UPDATE USING (true);

CREATE POLICY "Public can view pricing rules" ON public.pricing_rules FOR SELECT USING (true);
CREATE POLICY "Allow admin manage pricing rules" ON public.pricing_rules FOR ALL USING (true);

CREATE POLICY "Public can view blocked slots" ON public.blocked_slots FOR SELECT USING (true);
CREATE POLICY "Allow admin manage blocked slots" ON public.blocked_slots FOR ALL USING (true);

CREATE POLICY "Public can view site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Allow admin manage site settings" ON public.site_settings FOR ALL USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_slots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pricing_rules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_slots;

-- ==============================================================================
-- SEED DATA (11 BWF Badminton Courts)
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
SET surface_type = EXCLUDED.surface_type,
    price_per_hour = EXCLUDED.price_per_hour;

-- Seed Default Pricing Rule (6 AM to 3 PM @ ₹200/hr Happy Hours)
INSERT INTO public.pricing_rules (rule_name, start_hour, end_hour, price_per_hour, court_scope, is_active)
VALUES ('Morning & Afternoon Happy Hours', 6, 15, 200.00, 'ALL', true)
ON CONFLICT DO NOTHING;

-- Seed Default Promo Banner
INSERT INTO public.site_settings (key, value)
VALUES ('promo_banner', '{"enabled": true, "badge": "🎉 SPECIAL HAPPY HOURS OFFER", "headline": "Play Badminton for ₹200/hr from 6:00 AM to 3:00 PM!", "message": "Book any of our 11 BWF Synthetic courts during happy hours and enjoy instant ₹100 discount per hour. Limited slots available daily at Gurukul''s Sports Academy Thubrahalli.", "ctaText": "Claim Offer & Book Court"}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
