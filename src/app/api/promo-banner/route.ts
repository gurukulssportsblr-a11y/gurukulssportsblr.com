export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getPromoBanner, savePromoBanner } from '@/lib/server-store';

export async function GET() {
  try {
    const banner = await getPromoBanner();
    return NextResponse.json({ success: true, banner });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const updated = await savePromoBanner(body);
    return NextResponse.json({ success: true, banner: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
