import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getCustomOrderSettings, normalizeInstagramUsername, setCustomOrderSettings } from '@/lib/customOrderSettings';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const settings = await getCustomOrderSettings();
  return NextResponse.json({ ok: true, ...settings });
}

export async function PUT(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (typeof body?.instagramUsername === 'string' && normalizeInstagramUsername(body.instagramUsername) === null) {
    return NextResponse.json({ error: 'Enter a valid Instagram username or profile URL.' }, { status: 400 });
  }

  const updated = await setCustomOrderSettings({
    enabled: typeof body?.enabled === 'boolean' ? body.enabled : undefined,
    message: typeof body?.message === 'string' ? body.message : undefined,
    instagramUsername: typeof body?.instagramUsername === 'string' ? body.instagramUsername : undefined
  });

  return NextResponse.json({ ok: true, ...updated });
}
