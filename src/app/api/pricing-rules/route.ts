import { NextResponse } from 'next/server';
import { getPricingRules, savePricingRule, deletePricingRule } from '@/lib/server-store';

export async function GET() {
  try {
    const rules = await getPricingRules();
    return NextResponse.json({ success: true, rules });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { rule_name, start_hour, end_hour, price_per_hour, court_scope, is_active, id } = body;

    if (!rule_name || start_hour === undefined || end_hour === undefined || !price_per_hour) {
      return NextResponse.json({ error: 'Missing required rule parameters' }, { status: 400 });
    }

    const saved = await savePricingRule({
      id,
      rule_name: String(rule_name).trim(),
      start_hour: Number(start_hour),
      end_hour: Number(end_hour),
      price_per_hour: Number(price_per_hour),
      court_scope: court_scope || 'ALL',
      is_active: is_active !== undefined ? Boolean(is_active) : true,
    });

    return NextResponse.json({ success: true, rule: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Rule ID required' }, { status: 400 });
    }
    await deletePricingRule(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
