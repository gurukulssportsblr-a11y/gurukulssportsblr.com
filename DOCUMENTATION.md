# 🏸 Gurukul's Sports Academy Thubrahalli — Comprehensive System Documentation

## 1. Executive Summary
This document provides a comprehensive technical and operational overview of the **Gurukul's Sports Academy** online booking platform and full-stack **Host Control Operations Portal**. 

The platform connects real-time player reservations with a live **Supabase PostgreSQL database**, dynamic discount pricing rules, court maintenance management, and automated booking cancellation tools.

---

## 2. System Architecture & Tech Stack

```
[ Customer Booking Portal ]    <--->    [ Next.js API Layer ]    <--->    [ Supabase PostgreSQL ]
  (Next.js 14 Responsive UI)             (/api/bookings, etc.)              (11 Courts, Bookings, Slots)
             ^                                     ^
             |                                     |
[ Host Operations Panel ]       <------------------+
  (/admin & /admin.html)
```

- **Frontend Framework:** Next.js 14 (App Router), React 18, Tailwind CSS, Material Symbols Icons
- **Backend APIs:** Next.js Serverless Route Handlers (`/api/bookings`, `/api/cancel`, `/api/courts`, `/api/pricing-rules`, `/api/blocked-slots`, `/api/promo-banner`, `/api/db-status`)
- **Database:** Supabase PostgreSQL (Project Ref: `egrpofmcquzcurmtwwix`)
- **Hosting & CI/CD:** Vercel Production Deployment ([gurukulssportsblr-com.vercel.app](https://gurukulssportsblr-com.vercel.app/))
- **Repository:** GitHub (`gurukulssportsblr-a11y/gurukulssportsblr.com`)

---

## 3. Key Features & Work Accomplished

### A. 11 BWF Synthetic Badminton Courts Matrix
- Fully upgraded court inventory from 10 to **11 BWF Synthetic Badminton Courts** (Court 1 through Court 11), matching the official physical arena layout from `format.png`.
- Baseline pricing set to **₹300/hour** for all courts across 18 time slots daily (6:00 AM to 12:00 AM Midnight).

### B. Dynamic Slot Pricing & Happy Hours Engine
- **Dedicated Endpoint:** `/api/pricing-rules` (GET, POST, DELETE)
- **Capability:** Allows arena managers to create custom pricing rules (e.g. 6:00 AM to 3:00 PM @ ₹200/hr) applicable to:
  - **All 11 Courts**
  - **Courts 1–5 Only**
- **Live Reflection:** Discounted slots immediately show with **`⚡ OFFER`** badges on the website, and price calculations dynamically apply to booking totals.

### C. Court Maintenance & Blocking Engine
- **Dedicated Endpoint:** `/api/blocked-slots` (GET, POST, DELETE)
- **Capability:** Allows hosts to block individual courts or all 11 courts for mat maintenance, coaching camps, or state tournaments.
- **Live Reflection:** Blocked slots appear with a **`⚠️ Maintenance / Blocked`** tag and are disabled for public bookings.

### D. Promotional Announcement Bar & Welcome Pop-up
- **Dedicated Endpoint:** `/api/promo-banner` (GET, POST)
- **Capability:** Hosts can enable/disable top website announcement bars and modal pop-ups with custom headlines, offer badges, and promotional descriptions.

### E. End-to-End Database Integration (Supabase PostgreSQL)
- **Connected Database:** `https://egrpofmcquzcurmtwwix.supabase.co`
- **Tables Configured:**
  1. `courts`: Stores all 11 courts with numbering, surfaces, and baseline rates.
  2. `bookings`: Stores confirmed reservations with unique booking codes (`GS-XXXXXX`), customer name, 10-digit phone, and total amount.
  3. `booking_slots`: Individual slot locks (`court_id`, `slot_date`, `slot_time`, `status`).
  4. `pricing_rules`: Dynamic discount schedule.
  5. `blocked_slots`: Arena maintenance entries.
  6. `site_settings`: Global announcement banner configurations.
- **Relational Integrity:** Accurate UUID-to-Court Number mapping eliminates join errors.
- **Realtime / Serverless Transport:** Configured `NoopWebSocket` transport to ensure high-performance HTTPS REST database queries across Node.js serverless runtimes.

### F. Lookup & 1-Click Booking Cancellation
- **Dedicated Endpoint:** `/api/cancel` (GET, POST)
- **Search Options:** Customers and arena managers can look up reservations by:
  - 10-digit mobile number (e.g. `9482156333`)
  - Booking code (e.g. `GS-591897`)
- **Action:** 1-click cancellation immediately releases reserved slots back to available status on both the website and admin timetable.

### G. Timezone Optimization (Indian Standard Time - IST)
- Implemented `getNowInIST()` across date verification logic, ensuring serverless instances running in UTC data centers correctly evaluate local Indian daytime slots.

### H. Arena Contact Information & Google Maps Integration
- **Official Email:** `gurukulssportsblr@gmail.com`
- **Official Phones:** `+91 9482156333` and `+91 7676397018`
- **Direct Google Maps Link:** [https://maps.app.goo.gl/5wQLkvAL4tY11cTH9](https://maps.app.goo.gl/5wQLkvAL4tY11cTH9) (linked to address blocks and location pins).

---

## 4. API Endpoints Reference

| Route | Method(s) | Description |
| :--- | :--- | :--- |
| `/api/bookings` | `GET` | Returns booked slots, blocked slots, pricing rules, and register matrix for a given date. |
| `/api/bookings` | `POST` | Validates slots, calculates dynamic price, and writes booking + slots to Supabase. |
| `/api/cancel` | `GET` | Searches bookings by phone number or booking code. |
| `/api/cancel` | `POST` | Cancels a booking and releases the time slots in database. |
| `/api/pricing-rules` | `GET, POST, DELETE` | Creates and manages dynamic pricing rules. |
| `/api/blocked-slots` | `GET, POST, DELETE` | Blocks courts for maintenance or events. |
| `/api/promo-banner` | `GET, POST` | Reads and updates website promotional announcement. |
| `/api/courts` | `GET` | Returns list of all 11 active badminton courts. |
| `/api/db-status` | `GET` | Diagnostic health check returning connection status and record counts. |

---

## 5. Live Production URLs & Credentials

| Component | URL |
| :--- | :--- |
| **Customer Booking Website** | [https://gurukulssportsblr-com.vercel.app/](https://gurukulssportsblr-com.vercel.app/) |
| **Host Operations Portal** | [https://gurukulssportsblr-com.vercel.app/admin](https://gurukulssportsblr-com.vercel.app/admin) |
| **Database Diagnostics** | [https://gurukulssportsblr-com.vercel.app/api/db-status](https://gurukulssportsblr-com.vercel.app/api/db-status) |

### Host Portal Login:
- **Email:** `gurukulssportsblr@gmail.com`
- **Password:** `G#r#kul$Sp0rt$@blr`
