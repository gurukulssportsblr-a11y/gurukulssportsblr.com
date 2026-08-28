import { NextResponse } from 'next/server';
import { getBlockedSlots, addBlockedSlot, removeBlockedSlot } from '@/lib/server-store';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || undefined;
    const blocks = await getBlockedSlots(date);
    return NextResponse.json({ success: true, blocks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { court_number, block_date, start_hour, end_hour, reason } = body;

    if (court_number === undefined || !block_date || start_hour === undefined || end_hour === undefined) {
      return NextResponse.json({ error: 'Missing required block parameters' }, { status: 400 });
    }

    const newBlock = await addBlockedSlot({
      court_number: Number(court_number),
      block_date: String(block_date),
      start_hour: Number(start_hour),
      end_hour: Number(end_hour),
      reason: String(reason || 'Court Maintenance').trim(),
    });

    return NextResponse.json({ success: true, block: newBlock });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Block ID required' }, { status: 400 });
    }
    await removeBlockedSlot(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
