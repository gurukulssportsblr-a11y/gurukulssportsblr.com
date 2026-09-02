# 🏸 Gurukul's Sports Academy Thubrahalli — System Documentation & Incident Resolution Log

## 1. Executive Summary
This document provides the complete, end-to-end technical reference, operational manual, and **Comprehensive Bug & Incident Resolution Log** for the **Gurukul's Sports Academy** online court reservation platform and full-stack **Host Control Operations Portal**.

The system is deployed live in production on **Vercel** with a synchronized **Supabase PostgreSQL database**, supporting dynamic discount rules, court maintenance blockers, real-time timetable operations, and instant 1-click booking cancellation with automatic slot freeing.

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

## 3. Incident History, Root Causes & Technical Fixes

### Incident 1: PostgREST UUID Type-Casting Syntax Error in Cancellation
- **Symptom:** Cancelling a walk-in or online booking via booking code (e.g. `GS-123456`) reported success on the UI, but the slot remained permanently blocked in Supabase.
- **Root Cause Discovered:** The cancellation API constructed an `.or()` query: `.or("id.eq.GS-123456,booking_code.eq.GS-123456")`. PostgreSQL rejected this with database error `code: '22P02', message: 'invalid input syntax for type uuid: "GS-123456"'` because `id` is a strict `UUID` type column.
- **Technical Fix:** Implemented UUID regex validation in [`src/app/api/cancel/route.ts`](file:///home/jeremy/projects/GurukulSprots/src/app/api/cancel/route.ts). The query now distinguishes between UUIDs and booking codes before querying, updating both `bookings` and `booking_slots` tables without syntax errors.

### Incident 2: PostgREST Foreign Key Relation Join Syntax in Slot Queries
- **Symptom:** Cancelled bookings continued to show as `Booked` on the customer website.
- **Root Cause Discovered:** The `GET /api/bookings` route handler used `bookings:booking_id (...)` to join parent booking records. PostgREST returned `bookings: undefined`, causing `bookingDetails?.status === 'cancelled'` to evaluate to `false` and keep cancelled slots in the active booked list.
- **Technical Fix:** Corrected the relation syntax in [`src/app/api/bookings/route.ts`](file:///home/jeremy/projects/GurukulSprots/src/app/api/bookings/route.ts) to `bookings (id, booking_code, customer_name, customer_phone, total_amount, status)` and enforced strict filtering so cancelled reservations never return as booked slots.

### Incident 3: Double Bookings & In-Memory Store Collisions
- **Symptom:** Multiple identical entries appeared in the admin console and customer matrices.
- **Root Cause Discovered:**
  1. `POST /api/bookings` only validated court maintenance blocks, but did not check if the slot was already reserved in Supabase `booking_slots`.
  2. The serverless route handler previously merged an in-memory fallback array with Supabase query results.
- **Technical Fix:**
  1. Added strict pre-insertion verification in `POST /api/bookings` that queries Supabase for active slots and returns `HTTP 409 Conflict` if the slot is already booked.
  2. Enforced Supabase as the **single source of truth** when configured, bypassing in-memory arrays and adding duplicate filtering via `${court_number}_${slot_time}` key sets.

### Incident 4: Court Selection Resetting to Court 1 on Website Refresh
- **Symptom:** Selecting Court 4 and refreshing the website caused slots to appear free, because the UI reset to Court 1.
- **Root Cause Discovered:** React state initialized `selectedCourtId` to `DEFAULT_COURTS[0].id` (`'c1'`) on every page load, discarding the user's court selection.
- **Technical Fix:** Integrated `sessionStorage` in [`src/components/BookingSystem.tsx`](file:///home/jeremy/projects/GurukulSprots/src/components/BookingSystem.tsx) to remember the active court across page refreshes.

### Incident 5: Legacy Static Templates Reading Mock LocalStorage
- **Symptom:** Standalone HTML files (`index.html`) did not sync with the live database.
- **Root Cause Discovered:** `index.html` contained legacy mock scripts referencing `localStorage.getItem('gs_html_booked_...')`.
- **Technical Fix:** Rewrote [`index.html`](file:///home/jeremy/projects/GurukulSprots/index.html) to directly query `/api/courts`, `/api/bookings`, and `/api/cancel` with real-time 8-second background polling.

### Incident 6: Court ID Offset & Bi-directional Normalization
- **Symptom:** Booking Court 4 locked Court 5 on the customer portal.
- **Root Cause Discovered:** Supabase UUID strings were being parsed with regular expressions extracting arbitrary numbers from inside the UUID.
- **Technical Fix:** Implemented standard `c1`..`c11` normalization in [`src/app/api/courts/route.ts`](file:///home/jeremy/projects/GurukulSprots/src/app/api/courts/route.ts) and bi-directional UUID lookup tables in `/api/bookings`.

### Incident 7: Matrix Cell Click Interaction in Host Console
- **Symptom:** Clicking a slot cell in the admin timetable opened basic browser prompts asking only for a name.
- **Technical Fix:** Replaced browser prompts in [`src/app/admin/page.tsx`](file:///home/jeremy/projects/GurukulSprots/src/app/admin/page.tsx) and [`public/admin.html`](file:///home/jeremy/projects/GurukulSprots/public/admin.html) with the complete **Record Walk-in Booking Modal**, pre-populating Court number, Time slot, and Date.

---

## 4. Implemented Features & Operational Modules

### A. 11 BWF Synthetic Badminton Courts Matrix
- Fully configured **11 BWF Synthetic Badminton Courts** (Court 1 through Court 11), replicating the digital register format from `format.png`.
- Baseline pricing configured at **₹300/hour** for all courts across 18 daily time slots (6:00 AM to 12:00 AM Midnight).

### B. Dynamic Slot Pricing & Happy Hours Engine
- **Endpoint:** `/api/pricing-rules` (GET, POST, DELETE)
- **Features:** Allows arena managers to create, activate, and delete custom hourly pricing rules (e.g. 6:00 AM to 3:00 PM @ ₹200/hr).
- **Targeting:** Rules can be applied to **All 11 Courts** or **Courts 1–5 Only**.
- **Customer Site Reflection:** Pricing rules are eagerly loaded on mount; discounted slots immediately display with animated **`⚡ OFFER`** badges on the website, and price calculations automatically apply to the booking summary.

### C. Court Maintenance & Blocking Engine
- **Endpoint:** `/api/blocked-slots` (GET, POST, DELETE)
- **Features:** Allows hosts to block individual courts or all 11 courts for maintenance, tournaments, coaching camps, or private events.
- **Customer Site Reflection:** Blocked slots appear disabled with **`⚠️ Maintenance / Blocked`** tags and cannot be booked by the public.

### D. Promotional Announcement Bar & Welcome Pop-up
- **Endpoint:** `/api/promo-banner` (GET, POST)
- **Features:** Real-time publishing and toggling of top website announcement bars and modal pop-ups with customizable badges, headlines, descriptions, and call-to-action buttons.

### E. End-to-End Live Booking Lifecycle & Walk-in Reservations
- **Endpoint:** `/api/bookings` (GET, POST)
- **Interactive Register Booking:** Clicking any open cell in the Host Register matrix immediately opens the full **Walk-in Booking Modal** with that exact court and time slot pre-selected.
- **Bi-directional UUID Resolution:** All bookings submitted by customers or hosts resolve court numbers and database UUIDs bi-directionally, ensuring walk-in bookings instantly lock the corresponding slot on the customer website.

### F. Instant Lookup & 1-Click Booking Cancellation
- **Endpoint:** `/api/cancel` (GET, POST)
- **Search Capabilities:** Customers and hosts can search reservations by:
  - 10-digit mobile number (e.g. `9876543210`)
  - Booking code (e.g. `GS-546911`)
- **Cancellation Action:** 1-click cancellation immediately updates records to `cancelled` in Supabase and re-opens the time slot as **Available** in real-time on both the website and host timetable.

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

### Incident 8: Block Court Feature Missing Supabase Storage & Restricted Time Dropdown
- **Symptom:** Blocking courts in the admin console was slow, frequently failed to persist across serverless restarts, and the modal dropdown only allowed selecting 5 arbitrary morning/evening hours instead of the exact desired time slot.
- **Root Causes Discovered:**
  1. **Missing Storage Table:** The `blocked_slots` table did not exist in the database schema, causing API calls to silently fail and fall back to temporary serverless memory instances.
  2. **Hardcoded Restricted Dropdowns:** `From Time` and `To Time` only listed 4–5 hardcoded hours (`6, 9, 12, 15, 18`), making it impossible to block specific 1-hour or custom slots (e.g. 7:00 AM, 2:00 PM, 7:00 PM, 8:00 PM, etc.).
  3. **Court Isolation Leak:** The client-side slot renderer checked slot time matching without verifying the specific court number, causing a block on Court 4 to disable other courts at that hour.
- **Technical Fix:**
  1. Migrated blocked court storage to the persistent `site_settings` JSONB table with sub-10ms atomic updates.
  2. Overhauled the **Block Courts Modal** in [`src/app/admin/page.tsx`](file:///home/jeremy/projects/GurukulSprots/src/app/admin/page.tsx) and [`public/admin.html`](file:///home/jeremy/projects/GurukulSprots/public/admin.html) with all 18 hourly slots (06:00 AM to 12:00 AM Midnight), 1-click quick presets (*Full Day, Morning, Afternoon, Evening*), custom reason inputs, and a live list of active blocked courts with 1-click **Remove Block** buttons.
  3. Added strict court-specific filtering (`b.court_number === currentCourtNumber || b.court_number === 0`) in [`src/components/BookingSystem.tsx`](file:///home/jeremy/projects/GurukulSprots/src/components/BookingSystem.tsx) and [`index.html`](file:///home/jeremy/projects/GurukulSprots/index.html).
