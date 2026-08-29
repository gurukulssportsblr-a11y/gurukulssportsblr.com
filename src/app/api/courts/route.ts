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
      .order('court_number', { ascending: true });

    if (error) {
      console.error('Error fetching courts:', error);
      return NextResponse.json({ courts: DEFAULT_COURTS, isConfigured: true, error: error.message });
    }

    const dbCourts = (data as any[]) || [];

    // Ensure all 11 courts are normalized with id: 'c1'..'c11' and db_id: UUID
    const normalizedCourts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num) => {
      const match = dbCourts.find((dc) => dc.court_number === num);
      return {
        id: `c${num}`,
        db_id: match?.id || `c${num}`,
        court_number: num,
        name: `Court ${num}`,
        surface_type: (match?.surface_type as any) || 'Synthetic',
        price_per_hour: Number(match?.price_per_hour) || 300,
      };
    });

    return NextResponse.json({
      courts: normalizedCourts,
      isConfigured: true,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, courts: DEFAULT_COURTS });
  }
}
