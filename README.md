# Gurukul's Sports ® - Premier Badminton & Sports Hub Web Portal

A high-performance, modern sports arena booking platform designed for **Gurukul's Sports** on Varthur Main Road, Whitefield, Bengaluru. Built with **Next.js 14**, **Tailwind CSS**, **Supabase (PostgreSQL with Realtime)**, and engineered for **1-click Vercel Deployment** with custom domain support.

---

## 🏸 Key Features

- **Exact Elite Athleticism Design**: Faithful reproduction of the official design system (`DESIGN.md`) with Plus Jakarta Sans & Inter typography, Midnight Blue & Royal Blue accents, and high-contrast facility showcases.
- **Dynamic 10-Court Booking System**:
  - Court selection (BWF Synthetic & Wooden flooring tiers).
  - Flexible frequencies: One-time, Daily, Weekly (Weekends only), Weekly (Same day).
  - Real-time time slot matrix (6:00 AM – 12:00 AM) with automatic collision detection.
  - Interactive pricing breakdown and dynamic slot calculation.
- **Supabase PostgreSQL Backend**:
  - Full relational schema (`courts`, `bookings`, `booking_slots`).
  - Row Level Security (RLS) policies and real-time subscription support.
  - Atomic booking reservations preventing double-booking conflicts.
- **Self-Service Booking Lookup & Cancellation**:
  - Customers can look up bookings by phone number or Booking ID (`GS-XXXXXX`) and cancel slots to immediately free them up for other players.
- **Modular Confirmation Engine**:
  - Interactive success receipt with confetti and print/save capabilities.
  - Future-proof modular structure to plug in WhatsApp automated confirmations (via Twilio or Meta WhatsApp Cloud API).
- **Vercel & Custom Domain Ready**: Standard Next.js architecture with zero build errors and instant CDN edge performance.

---

## 🚀 Quick Setup & Local Development

### 1. Requirements
- Node.js 18+ (or 20+)
- npm / pnpm / yarn

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUz...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUz...
```
*(Note: If no credentials are provided, the app will run in offline Demo Mode with mock slots and bookings).*

### 4. Run Development Server
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000) to view the portal.

---

## 🗄️ Supabase Database Setup

1. Log in to [Supabase](https://supabase.com/) and create a new project.
2. Navigate to the **SQL Editor** in the left sidebar.
3. Open the file [`supabase/schema.sql`](./supabase/schema.sql) in this repository.
4. Copy its contents, paste them into the Supabase SQL Editor, and click **Run**.
5. This will automatically:
   - Create tables `courts`, `bookings`, and `booking_slots`.
   - Seed the 10 BWF Badminton courts with initial pricing.
   - Configure Row Level Security (RLS) policies and indexes.
   - Enable Realtime publication for live slot updates.
6. Go to **Project Settings** -> **API** to copy your **Project URL** and **Anon API Key**.

---

## 🌐 Deploying to Vercel & Adding Your Custom Domain

See the detailed step-by-step guide in [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md).

Summary:
1. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Gurukul Sports Web Portal"
   git remote add origin https://github.com/your-username/gurukul-sports.git
   git push -u origin main
   ```
2. Import repository in [Vercel](https://vercel.com).
3. Add the Supabase environment variables in Vercel project settings.
4. Click **Deploy**.
5. In Vercel, go to **Settings > Domains** and add your domain (e.g. `gurukulsports.com`).
6. Point your DNS records to Vercel (`76.76.21.21` for A record, `cname.vercel-dns.com` for CNAME).

---

## 📁 Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── bookings/route.ts   # Check availability & create reservations
│   │   │   ├── cancel/route.ts     # Customer lookup & cancellation
│   │   │   └── courts/route.ts     # Active courts catalog
│   │   ├── globals.css             # Theme tokens, font variables, court-slot styles
│   │   ├── layout.tsx              # Fonts, Material Icons, metadata
│   │   └── page.tsx                # Main portal page
│   ├── components/
│   │   ├── Navbar.tsx              # Responsive navigation & scrollspy
│   │   ├── Hero.tsx                # Hero banner with action CTAs
│   │   ├── Facilities.tsx          # Badminton, Swimming, Table Tennis cards
│   │   ├── BookingSystem.tsx       # Live booking engine with date, court & slot picker
│   │   ├── BookingSuccessModal.tsx # Booking confirmation receipt & confetti
│   │   ├── CancelBookingModal.tsx  # Booking search & slot release modal
│   │   └── Footer.tsx              # Arena address, hours, contact & map
│   └── lib/
│       ├── supabase/
│       │   ├── client.ts           # Browser Supabase client
│       │   ├── server.ts           # Server Supabase client
│       │   └── types.ts            # TypeScript Database interfaces
│       └── constants.ts            # Time slots & court catalog
├── supabase/
│   └── schema.sql                  # PostgreSQL tables, RLS, indexes & seed data
├── .env.example
├── README.md
└── VERCEL_DEPLOYMENT_GUIDE.md
```
