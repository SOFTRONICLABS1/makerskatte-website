import { NextResponse } from 'next/server';
import { getCustomOrderSettings } from '@/lib/customOrderSettings';

export async function GET() {
  const settings = await getCustomOrderSettings();
  return NextResponse.json({ ok: true, ...settings });
}
