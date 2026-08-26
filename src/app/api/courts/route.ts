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

    const courts = (data as any[]) || [];

    return NextResponse.json({
      courts: courts.length > 0 ? courts : DEFAULT_COURTS,
      isConfigured: true
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, courts: DEFAULT_COURTS }, { status: 500 });
  }
}
