# 🏸 Gurukul's Sports Academy Thubrahalli — Comprehensive System Documentation

## 1. Executive Summary
This document provides the complete, end-to-end technical reference and operational guide for the **Gurukul's Sports Academy** online court reservation platform and full-stack **Host Control Operations Portal**.

The system is deployed live in production on **Vercel** with a fully synchronized **Supabase PostgreSQL database**, supporting dynamic discount rules, court maintenance blockers, real-time timetable operations, and instant 1-click booking cancellation with automatic slot freeing.

---

## 2. System Architecture & Tech Stack

```
[ Customer Booking Portal ]    <--->    [ Next.js 14 Serverless APIs ]    <--->    [ Supabase PostgreSQL ]
  (Next.js 14 Responsive UI)             (/api/bookings, /api/cancel, etc.)         (11 Courts, Bookings, Slots)
             ^                                     ^
             |                                     |
[ Host Operations Panel ]       <------------------+
  (/admin & /admin.html)
```

- **Frontend Framework:** Next.js 14 (App Router), React 18, Tailwind CSS, Material Symbols Icons
- **Backend APIs:** Next.js Serverless Route Handlers (Enforced `force-dynamic`, `revalidate = 0` for real-time consistency)
- **Database:** Supabase PostgreSQL (`https://egrpofmcquzcurmtwwix.supabase.co`)
- **Hosting & CI/CD:** Vercel Production ([gurukulssportsblr-com.vercel.app](https://gurukulssportsblr-com.vercel.app/))
- **Source Code Repository:** GitHub (`gurukulssportsblr-a11y/gurukulssportsblr.com`)

---

## 3. Implemented Features & Operational Modules

### A. 11 BWF Synthetic Badminton Courts Matrix
- Fully configured **11 BWF Synthetic Badminton Courts** (Court 1 through Court 11), replicating the digital register format from `format.png`.
- Baseline pricing configured at **₹300/hour** for all courts across 18 daily time slots (6:00 AM to 12:00 AM Midnight).

### B. Dynamic Slot Pricing & Happy Hours Engine
- **Endpoint:** `/api/pricing-rules` (GET, POST, DELETE)
- **Features:** Allows arena managers to create, activate, and delete custom hourly pricing rules (e.g. 6:00 AM to 3:00 PM @ ₹200/hr).
- **Targeting:** Rules can be applied to **All 11 Courts** or **Courts 1–5 Only**.
- **Customer Site Reflection:** Discounted slots immediately display with animated **`⚡ OFFER`** badges on the website, and price calculations automatically apply to the booking summary.

### C. Court Maintenance & Blocking Engine
- **Endpoint:** `/api/blocked-slots` (GET, POST, DELETE)
- **Features:** Allows hosts to block individual courts or all 11 courts for maintenance, tournaments, coaching camps, or private events.
- **Customer Site Reflection:** Blocked slots appear disabled with **`⚠️ Maintenance / Blocked`** tags and cannot be booked by the public.

### D. Promotional Announcement Bar & Welcome Pop-up
- **Endpoint:** `/api/promo-banner` (GET, POST)
- **Features:** Real-time publishing and toggling of top website announcement bars and modal pop-ups with customizable badges, headlines, descriptions, and call-to-action buttons.

### E. End-to-End Live Booking Lifecycle
- **Endpoint:** `/api/bookings` (GET, POST)
- **Validation:**
  - Enforces Indian Standard Time (`getNowInIST()`) to prevent past-time bookings across serverless regions.
  - Automatically validates against active maintenance blockers.
  - Generates unique customer reservation codes (`GS-XXXXXX`).
- **Database Persistence:** Directly inserts records into `bookings` and `booking_slots` tables in Supabase with relational UUID integrity.

### F. Instant Lookup & 1-Click Booking Cancellation
- **Endpoint:** `/api/cancel` (GET, POST)
- **Search Capabilities:** Customers and hosts can search reservations by:
  - 10-digit mobile number (e.g. `9876543210`)
  - Booking code (e.g. `GS-546911`)
- **Cancellation Action:** 1-click cancellation immediately updates records to `cancelled` in Supabase and re-opens the time slot as **Available** in real-time on both the website and host timetable.

### G. Host Operations Control Panel
- **Routes:** `/admin` (React Dynamic Dashboard) and `/admin.html` (Static Fallback)
- **Register Table:** Full 18-hour $\times$ 11-court interactive register matrix with booked player details, revenue stats, occupancy metrics, quick-booking modal, and walk-in reservation recording.

---

## 4. API Endpoints Reference

| Route | Method(s) | Caching | Description |
| :--- | :--- | :---: | :--- |
| `/api/bookings` | `GET` | `force-dynamic` | Returns booked slots, blocked slots, pricing rules, and register matrix for a given date. |
| `/api/bookings` | `POST` | `force-dynamic` | Validates slots, calculates dynamic price, and writes booking + slots to Supabase. |
| `/api/cancel` | `GET` | `force-dynamic` | Searches bookings by 10-digit phone number or `GS-XXXXXX` booking code. |
| `/api/cancel` | `POST` | `force-dynamic` | Cancels a booking and frees the time slots immediately in database. |
| `/api/pricing-rules` | `GET, POST, DELETE` | `force-dynamic` | Creates, lists, and deletes dynamic pricing rules. |
| `/api/blocked-slots` | `GET, POST, DELETE` | `force-dynamic` | Manages court maintenance blocks. |
| `/api/promo-banner` | `GET, POST` | `force-dynamic` | Reads and updates website promotional announcements. |
| `/api/courts` | `GET` | `force-dynamic` | Returns list of all 11 active badminton courts. |
| `/api/db-status` | `GET` | `force-dynamic` | Diagnostic health check returning connection status and record counts. |

---

## 5. Database Schema Reference (PostgreSQL)

```sql
-- 1. COURTS
CREATE TABLE public.courts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_number INTEGER UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    surface_type VARCHAR(50) NOT NULL DEFAULT 'Synthetic',
    price_per_hour NUMERIC(10, 2) NOT NULL DEFAULT 300.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. BOOKINGS
CREATE TABLE public.bookings (
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
    status VARCHAR(30) NOT NULL DEFAULT 'confirmed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    cancelled_at TIMESTAMPTZ
);

-- 3. BOOKING SLOTS
CREATE TABLE public.booking_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    court_id UUID NOT NULL REFERENCES public.courts(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    slot_time VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'booked',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. PRICING RULES
CREATE TABLE public.pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(150) NOT NULL,
    start_hour INTEGER NOT NULL,
    end_hour INTEGER NOT NULL,
    price_per_hour NUMERIC(10, 2) NOT NULL DEFAULT 200.00,
    court_scope VARCHAR(50) NOT NULL DEFAULT 'ALL',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. BLOCKED COURTS
CREATE TABLE public.blocked_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_number INTEGER NOT NULL,
    block_date DATE NOT NULL,
    start_hour INTEGER NOT NULL,
    end_hour INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL DEFAULT 'Court Maintenance',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. SITE SETTINGS
CREATE TABLE public.site_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
```

---

## 6. Official Arena Contacts & Location Integration

- **Official Email:** `gurukulssportsblr@gmail.com`
- **Phone Numbers:** `+91 9482156333` and `+91 7676397018`
- **Location:** Varthur Main Road, near Kapoor's Cafe, Whitefield, Bengaluru, Karnataka 560066
- **Direct Google Maps Pin:** [https://maps.app.goo.gl/5wQLkvAL4tY11cTH9](https://maps.app.goo.gl/5wQLkvAL4tY11cTH9)

---

## 7. Live Production URLs & Credentials

| Resource | URL |
| :--- | :--- |
| **Customer Booking Website** | [https://gurukulssportsblr-com.vercel.app/](https://gurukulssportsblr-com.vercel.app/) |
| **Host Operations Portal** | [https://gurukulssportsblr-com.vercel.app/admin](https://gurukulssportsblr-com.vercel.app/admin) |
| **Database Diagnostics** | [https://gurukulssportsblr-com.vercel.app/api/db-status](https://gurukulssportsblr-com.vercel.app/api/db-status) |
| **Supabase Dashboard** | [https://supabase.com/dashboard/project/egrpofmcquzcurmtwwix](https://supabase.com/dashboard/project/egrpofmcquzcurmtwwix) |

### Host Control Login Credentials:
- **Email:** `gurukulssportsblr@gmail.com`
- **Password:** `G#r#kul$Sp0rt$@blr`
