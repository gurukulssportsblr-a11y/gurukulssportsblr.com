export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { DEFAULT_COURTS } from '@/lib/constants';

export async function GET() {
  try {
    if (!isSupabaseConfigured) {
      return NextResponse.json({
        courts: DEFAULT_COURTS,
        isConfigured: false
      });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('courts')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching courts:', error);
      return NextResponse.json({ courts: DEFAULT_COURTS, isConfigured: true, error: error.message }, { status: 500 });
    }

    let courts = (data as any[]) || [];

    if (courts.length === 0) {
      const seedInserts = DEFAULT_COURTS.map((c) => ({
        court_number: c.court_number,
        name: c.name,
        surface_type: c.surface_type,
        price_per_hour: c.price_per_hour,
        is_active: true,
        display_order: c.court_number,
      }));
      const { data: seeded } = await supabase
        .from('courts')
        .upsert(seedInserts, { onConflict: 'court_number' })
        .select();
      if (seeded && seeded.length > 0) courts = seeded;
    }

    return NextResponse.json({
      courts: courts.length > 0 ? courts : DEFAULT_COURTS,
      isConfigured: true,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, courts: DEFAULT_COURTS }, { status: 500 });
  }
}
