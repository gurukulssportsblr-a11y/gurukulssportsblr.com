# 🌐 Vercel Deployment & Custom Domain Setup Guide

This guide walks you through deploying **Gurukul's Sports Portal** on **Vercel**, connecting **Supabase**, and attaching your **custom domain** (e.g., `gurukulsports.in` or `gurukulsports.com`).

---

## Step 1: Create Your Supabase Database

1. Sign in to [Supabase](https://supabase.com/).
2. Click **New Project** and name it (e.g., `gurukul-sports`).
3. Select your preferred database region (e.g., `South Asia (Mumbai)` for fastest response in Bengaluru/India).
4. Once the database is provisioned, click **SQL Editor** on the left menu.
5. Copy the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) and paste them into the SQL Editor.
6. Click **Run**. This will set up:
   - `courts` table (with 10 BWF Badminton courts seeded).
   - `bookings` & `booking_slots` tables.
   - Collision protection indexes & Row Level Security (RLS) policies.
   - Supabase Realtime subscriptions.
7. Go to **Project Settings** -> **API**:
   - Copy **Project URL** (e.g. `https://xyzcompany.supabase.co`).
   - Copy **anon public API Key** (e.g. `eyJhbGciOi...`).
   - (Optional) Copy **service_role secret key**.

---

## Step 2: Push Your Code to GitHub / GitLab

In your project directory (`/home/jeremy/projects/GurukulSprots`):

```bash
git init
git add .
git commit -m "feat: complete Gurukul Sports portal with Next.js, Supabase, and Tailwind"
```

Create a new repository on GitHub (e.g., `gurukul-sports`) and push:
```bash
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/gurukul-sports.git
git push -u origin main
```

---

## Step 3: Deploy on Vercel

1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** -> **Project**.
3. Select your `gurukul-sports` GitHub repository and click **Import**.
4. In the **Configure Project** screen:
   - **Framework Preset**: `Next.js` (automatically detected).
   - **Root Directory**: `./`
5. Expand **Environment Variables** and add the following:

| Key | Value | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi...` | (Optional) Service Role Key |

6. Click **Deploy**.
7. Vercel will build and launch your application in under 60 seconds! You will receive an initial URL like `gurukul-sports.vercel.app`.

---

## Step 4: Buying and Adding a Custom Domain

You have two simple options for your domain:

### Option A: Buy directly inside Vercel (Easiest, zero DNS config)
1. In your Vercel Dashboard, go to **Settings** -> **Domains**.
2. Type your desired domain name (e.g., `gurukulsports.in` or `gurukulsports.com`).
3. If it's available, click **Buy**.
4. Vercel will automatically purchase, configure the DNS records, and issue an SSL certificate for you.

---

### Option B: Buy from a Registrar (Namecheap, GoDaddy, Cloudflare, Google/Squarespace, Hostinger)
1. Purchase your domain (e.g., from [Namecheap](https://www.namecheap.com/) or [GoDaddy](https://www.godaddy.com/)).
2. In your Vercel project dashboard, go to **Settings** -> **Domains**.
3. Enter your domain name:
   - Add `gurukulsports.com`
   - Add `www.gurukulsports.com` (Vercel will ask to automatically redirect `www` to apex or vice versa).
4. Vercel will show the required DNS records.
5. Log in to your domain registrar's DNS Management panel and add the following two records:

#### 1. Apex Domain Record (`@`):
- **Type**: `A`
- **Host / Name**: `@` (or leave empty depending on registrar)
- **Value / Target**: `76.76.21.21`
- **TTL**: Automatic (or 3600)

#### 2. Subdomain Record (`www`):
- **Type**: `CNAME`
- **Host / Name**: `www`
- **Value / Target**: `cname.vercel-dns.com`
- **TTL**: Automatic (or 3600)

6. Within a few minutes (up to 24 hours max), Vercel will verify the DNS and automatically provision a free **Let's Encrypt SSL certificate** (`https://`).

---

## Step 5: (Future) Enabling WhatsApp Confirmation Notifications

When you are ready to activate WhatsApp notifications:
1. Get a Twilio WhatsApp account or Meta WhatsApp Cloud API credentials.
2. In `src/app/api/bookings/route.ts`, enable the webhook/API call to dispatch the booking confirmation template with player name, booking code, date, and court slots.
