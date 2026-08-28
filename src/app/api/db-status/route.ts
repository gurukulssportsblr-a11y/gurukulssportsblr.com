export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const hasUrl = Boolean(url && !url.includes('your-project'));
  const hasKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  let connectionStatus = 'Disconnected (Missing Supabase URL or Key in Vercel Environment Variables)';
  let errorDetail = null;
  let courtsCount = 0;
  let bookingsCount = 0;

  if (isSupabaseConfigured) {
    try {
      const supabase = createServerClient();
      const { data: courts, error: courtsErr } = await supabase.from('courts').select('id, court_number');
      const { data: bookings, error: bookingsErr } = await supabase.from('bookings').select('id');

      if (courtsErr) {
        connectionStatus = 'Error querying tables';
        errorDetail = courtsErr.message;
      } else {
        connectionStatus = 'Connected Successfully to Live Supabase Database';
        courtsCount = courts?.length || 0;
        bookingsCount = bookings?.length || 0;
      }
    } catch (err: any) {
      connectionStatus = 'Exception during connection';
      errorDetail = err.message;
    }
  }

  return NextResponse.json({
    supabaseConfigured: isSupabaseConfigured,
    hasUrl,
    hasKey,
    connectionStatus,
    errorDetail,
    courtsCount,
    bookingsCount,
    timestamp: new Date().toISOString(),
  });
}
