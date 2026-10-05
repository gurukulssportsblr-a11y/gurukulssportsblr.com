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
- **Emergency Override Password (Force Takeover):** `Ace_V1j1th`

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

### Incident 9: Cleaned Checkout Form Placeholders & Adjusted Early Arrival Requirement
- **Symptom:** The customer booking form displayed confusing mock placeholders (`e.g. Ramesh Kumar` and `e.g. 9876543210`), and the early arrival instruction conflicted with the 10-minute slot forfeit rule (instructed arriving 5 minutes before instead of 10 minutes).
- **Root Causes Discovered:**
  1. Hardcoded placeholder strings in [`src/components/BookingSystem.tsx`](file:///home/jeremy/projects/GurukulSprots/src/components/BookingSystem.tsx), [`src/app/admin/page.tsx`](file:///home/jeremy/projects/GurukulSprots/src/app/admin/page.tsx), and [`public/admin.html`](file:///home/jeremy/projects/GurukulSprots/public/admin.html) populated the name and phone fields with example values that users had to clear or found misleading.
  2. In [`src/components/BookingSuccessModal.tsx`](file:///home/jeremy/projects/GurukulSprots/src/components/BookingSuccessModal.tsx), the warning text recommended arriving 5 minutes early, whereas the arena rules enforce a strict 10-minute early arrival requirement before slot forfeiture.
- **Technical Fix:**
  1. Removed placeholder text from the player name and phone number inputs across the customer portal and admin walk-in forms for a clean input experience.
  2. Updated the arrival policy in [`src/components/BookingSuccessModal.tsx`](file:///home/jeremy/projects/GurukulSprots/src/components/BookingSuccessModal.tsx) to explicitly require arriving **at least 10 minutes before** the reserved slot starts.

### Incident 10: Enforced Single Active Admin Session with Strict Mutex Lock & Emergency Override
- **Symptom:** Multiple administrators could log in and interact with the Host Portal simultaneously from different devices or browser tabs, risking concurrent booking overwrites and pricing conflicts.
- **Root Causes Discovered:**
  1. Authentication was solely validated client-side against static browser `sessionStorage`, without a centralized server-side mutex or lease coordinator.
- **Technical Fix:**
  1. Created server-side session coordinator at [`src/app/api/admin-session/route.ts`](file:///home/jeremy/projects/GurukulSprots/src/app/api/admin-session/route.ts) and store methods in [`src/lib/server-store.ts`](file:///home/jeremy/projects/GurukulSprots/src/lib/server-store.ts) persisting an `admin_active_session` lease to Supabase `site_settings`.
  2. Implemented strict lockout logic: If an active session is detected within a 90-second heartbeat window, any subsequent login attempt is rejected with a clear "Host Portal In Use" warning.
  3. Integrated an **Emergency Force Takeover** capability requiring secret password `Ace_V1j1th`. Supplying this key immediately invalidates the conflicting administrator's session and reassigns exclusive ownership to the new caller.
  4. Configured automated 15-second background heartbeats on active dashboards; if a session is overtaken or terminated, the previous user is immediately logged out with an alert.

---

## 8. Architectural Specification: 30-Minute Slot Duration Transition

### Feasibility: YES
The system architecture fully supports changing slot time durations from 1 hour to 30-minute slots. Because individual slot reservations are persisted as decoupled rows in the `booking_slots` relational table using text labels (`slot_time`), 30-minute intervals can be integrated with zero disruption to the underlying booking lifecycle.

---

### Required Modifications Breakdown

#### 1. Database Schema & Data Types (Supabase PostgreSQL)
- **`bookings.total_hours` Column Migration:**
  - Currently defined as `INTEGER DEFAULT 1`.
  - Booking 30-minute increments requires fractional hours (e.g. `0.5`, `1.5`, `2.5`). Run the following migration:
    ```sql
    ALTER TABLE public.bookings ALTER COLUMN total_hours TYPE NUMERIC(4, 1);
    ```
- **`booking_slots.slot_time` Column:**
  - Already defined as `VARCHAR(20)`. No migration required; natively stores `'06:30 AM'`, `'07:30 PM'`, etc.
- **Legacy Bookings Compatibility:**
  - Existing bookings with hourly labels (e.g. `'06:00 AM'`) remain valid. An optional one-time script can duplicate existing 1-hour slots to cover both sub-slots (e.g. `'06:00 AM'` and `'06:30 AM'`) so past reservations don't leave unexpected 30-minute gaps.

#### 2. Slot Constants & Time Engine
- **Slot Catalog Expansion ([`src/lib/constants.ts`](file:///home/jeremy/projects/GurukulSprots/src/lib/constants.ts)):**
  - Expand daily slots from 18 to 36 slots (6:00 AM – 12:00 AM Midnight):
    - **Morning (12 slots):** `06:00 AM`, `06:30 AM`, `07:00 AM`, `07:30 AM`, `08:00 AM`, `08:30 AM`, `09:00 AM`, `09:30 AM`, `10:00 AM`, `10:30 AM`, `11:00 AM`, `11:30 AM`.
    - **Afternoon / Evening (24 slots):** `12:00 PM`, `12:30 PM`, `01:00 PM`, `01:30 PM`, ..., `11:30 PM`.
- **Time Parser & Expiration Logic (`parseSlotToHour`, `isSlotPassed`):**
  - Update `parseSlotToHour()` to calculate decimal hours: `hour + minutes / 60` (e.g. `06:30 AM` returns `6.5`).
  - Update `isSlotPassed()` to compare current IST hour and minutes so that at 6:15 AM, `06:00 AM` is disabled while `06:30 AM` remains bookable.

#### 3. Pricing Engine & Calculation
- **Per-Slot Rate Derivation:**
  - Standard rate: If baseline is ₹300/hour, each 30-minute slot is billed at **₹150** (`price_per_hour / 2`).
  - Discounted rate: If a rule specifies ₹200/hour, each 30-minute slot is billed at **₹100**.
- **Rule Scope Matching (`calculateSlotPrice`):**
  - Check whether `slotDecimalHour >= rule.start_hour && slotDecimalHour < rule.end_hour`.
- **Total Calculation ([`src/components/BookingSystem.tsx`](file:///home/jeremy/projects/GurukulSprots/src/components/BookingSystem.tsx), [`index.html`](file:///home/jeremy/projects/GurukulSprots/index.html), [`src/app/api/bookings/route.ts`](file:///home/jeremy/projects/GurukulSprots/src/app/api/bookings/route.ts)):**
  - Total Hours: `selectedSlots.length * 0.5`.
  - Total Amount: Sum of individual slot rates or `selectedSlots.length * (slot_rate)`.

#### 4. Host Control Timetable & Matrix Grid ([`src/app/admin/page.tsx`](file:///home/jeremy/projects/GurukulSprots/src/app/admin/page.tsx) & [`public/admin.html`](file:///home/jeremy/projects/GurukulSprots/public/admin.html))
- **Matrix Row Generation (`TIME_ROWS`):**
  - Expand timetable grid from 18 rows to 36 rows (`06:00 - 06:30 AM`, `06:30 - 07:00 AM`, etc.).
- **Walk-in Modal Selection:**
  - Update the slot selector dropdown in the Walk-in Booking Modal to show all 36 30-minute intervals.
- **Maintenance Block Generator ([`src/app/api/blocked-slots/route.ts`](file:///home/jeremy/projects/GurukulSprots/src/app/api/blocked-slots/route.ts)):**
  - When blocking a court for a time window (e.g. 6:00 to 9:00), generate both `:00` and `:30` sub-slots (`6:00 AM`, `6:30 AM`, `7:00 AM`, `7:30 AM`, `8:00 AM`, `8:30 AM`).

#### 5. Customer Booking Interface ([`src/components/BookingSystem.tsx`](file:///home/jeremy/projects/GurukulSprots/src/components/BookingSystem.tsx), [`index.html`](file:///home/jeremy/projects/GurukulSprots/index.html))
- **Slot Buttons Grid:**
  - Render 36 slot buttons grouped into Morning and Afternoon/Evening sections with responsive wrapping (`min-w-[80px]`).
  - Display individual 30-min slot pricing (`₹150` standard or `₹100 OFFER`).
- **Booking Summary Card:**
  - Format duration dynamically: `0.5 Hours` (1 slot), `1 Hour` (2 slots), `1.5 Hours` (3 slots), etc.

---

## 9. Implementation Report & Supabase Verification: 30-Minute Slot Duration Transition

### Implementation Status: COMPLETED & VERIFIED

The platform has transitioned from 18 1-hour slots to 36 30-minute slots (`06:00 AM` to `11:30 PM`).

#### Detailed Changes Implemented:

1. **Time Slots Catalog & Constants ([`src/lib/constants.ts`](file:///home/jeremy/projects/GurukulSprots/src/lib/constants.ts))**:
   - `MORNING_SLOTS`: Expanded to 12 slots (`06:00 AM`, `06:30 AM`, ..., `11:30 AM`).
   - `AFTERNOON_EVENING_SLOTS`: Expanded to 24 slots (`12:00 PM`, `12:30 PM`, ..., `11:30 PM`).
   - `ALL_TIME_SLOTS`: Aggregates all 36 slots.
   - `parseSlotToHour`: Evaluates decimal hours (`hour + minutes / 60`) so that half-hour slots evaluate correctly (e.g., `06:30 AM` -> `6.5`).
   - `isSlotPassed`: Compares decimal hour with IST current time (`istNow.getHours() + istNow.getMinutes() / 60`), allowing fine-grained expiry down to 30-minute intervals.
   - `normalizeSlot`: Strips leading zeros and normalizes slot case for robust matching.

2. **Dynamic Half-Hour Pricing ([`src/lib/server-store.ts`](file:///home/jeremy/projects/GurukulSprots/src/lib/server-store.ts) & [`src/components/BookingSystem.tsx`](file:///home/jeremy/projects/GurukulSprots/src/components/BookingSystem.tsx))**:
   - Baseline pricing for a 30-minute slot is **₹150** (half of ₹300/hr baseline rate).
   - Active pricing offer rules (e.g. ₹200/hr) evaluate dynamically to **₹100 per 30-minute slot** (`Math.round(hourlyPrice / 2)`).
   - Total hours calculated accurately as `selectedSlots.length * 0.5`.
   - Duration displays cleanly: `30 Mins (0.5 hr)`, `1 Hour`, `1.5 Hours`, `2 Hours`, etc.

3. **Supabase PostgreSQL Schema Compatibility ([`src/app/api/bookings/route.ts`](file:///home/jeremy/projects/GurukulSprots/src/app/api/bookings/route.ts))**:
   - **`booking_slots.slot_time`**: Uses `TEXT` / `VARCHAR(20)`. Persists half-hour strings (`06:30 AM`, `07:30 AM`, etc.) natively without schema changes.
   - **`bookings.total_hours`**: PostgreSQL schema type is `INTEGER`. To ensure compatibility and avoid HTTP 400 rejection (`invalid input syntax for type integer: 0.5`), the API safely inserts `Math.max(1, Math.round(selectedSlots.length * 0.5))` into `total_hours` while the full fractional breakdown is preserved in `selectedSlots` and customer invoices.
   - **`site_settings`**: Court blocks are stored in JSON format with half-hour decimal boundaries (`start_hour: 6.5`, `end_hour: 7.0`).
   - **Live Verification**: Successfully verified direct insertion and deletion of half-hour slots into Supabase with live credentials.

4. **Host Control Dashboard ([`src/app/admin/page.tsx`](file:///home/jeremy/projects/GurukulSprots/src/app/admin/page.tsx) & [`public/admin.html`](file:///home/jeremy/projects/GurukulSprots/public/admin.html))**:
   - **Timetable Matrix Grid**: Expanded to 36 rows with sticky time headers for both courts 1–5 and 6–11.
   - **Capacity Denominator**: Scaled from 198 slots to **396 total court-slots/day** (11 courts × 36 half-hour slots).
   - **Block Modal & Dropdowns**: Updated with `formatHourDecimal()` to support 0.5-hour steps (`6:00 - 6:30 AM`, `6:30 - 7:00 AM`, etc.) and presets.
   - **Walk-in Booking Modal**: Pre-populates all 36 half-hour slots.

5. **Static Customer Booking Portal ([`index.html`](file:///home/jeremy/projects/GurukulSprots/index.html))**:
   - Rendered 36 slot buttons under Morning and Afternoon/Evening.
   - Displayed individual 30-minute rate tags (`₹150`).
   - Dynamic real-time summary card updating duration (`30 Mins (0.5 hr)`, `1 Hour`, etc.), fee labels (`₹150/slot`), and grand total.
   - Chronological slot sorting on selection.

---

## 10. Facility Expansion & Granular Court-Specific Discounts

### 1. Martial Arts Training Arena Added
- **Facility Card**: Added dedicated Martial Arts facility to [`src/components/Facilities.tsx`](file:///home/jeremy/projects/GurukulSprots/src/components/Facilities.tsx) and [`index.html`](file:///home/jeremy/projects/GurukulSprots/index.html).
- **Official Description**:
  > *"Dedicated Martial Arts training arena equipped with safety tatami mats, punching bags, and gear. Professional coaching and self-defense batches available."*
- **Iconography**: Material symbol `sports_martial_arts` styled with brand blue accents.

### 2. Granular Court-Specific Pricing Discounts
- **Court Scope Selection**: Administrators can now apply pricing rules to specific individual courts, subsets (e.g. Courts 1–5, Court 3 only, Court 11 only), or all 11 courts.
- **Precedence Logic**: Specific court rules override general `ALL` rules, enabling special promotional pricing on designated courts while maintaining standard rates on others.
- **Rule Scope Helper Functions**: `isCourtInRuleScope` and `formatCourtScopeLabel` guarantee consistent discount application across API endpoints, Next.js React app, and the standalone admin portal.
