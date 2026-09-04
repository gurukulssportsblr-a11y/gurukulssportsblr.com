export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import {
  attemptAdminLogin,
  heartbeatAdminSession,
  logoutAdminSession,
  getAdminActiveSession,
  ADMIN_SESSION_TIMEOUT_MS,
} from '@/lib/server-store';

const ADMIN_EMAIL = 'gurukulssportsblr@gmail.com';
const ADMIN_PASSWORD = 'G#r#kul$Sp0rt$@blr';
const EMERGENCY_OVERRIDE_PASSWORD = 'Ace_V1j1th';

export async function GET() {
  try {
    const current = await getAdminActiveSession();
    const now = Date.now();
    const isLocked = !!(
      current &&
      current.sessionId &&
      typeof current.lastHeartbeat === 'number' &&
      now - current.lastHeartbeat < ADMIN_SESSION_TIMEOUT_MS
    );

    return NextResponse.json({
      success: true,
      locked: isLocked,
      activeSince: isLocked ? current?.startedAt : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'login') {
      const email = (body.email || '').trim();
      const password = (body.password || '').trim();
      const forceOvertake = !!body.forceOvertake;
      const forceOvertakePassword = (body.forceOvertakePassword || '').trim();

      // 1. Verify master credentials
      if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password.' },
          { status: 401 }
        );
      }

      // 2. Handle emergency force overtake
      if (forceOvertake) {
        if (forceOvertakePassword !== EMERGENCY_OVERRIDE_PASSWORD) {
          return NextResponse.json(
            { success: false, error: 'Incorrect Emergency Override Password.' },
            { status: 401 }
          );
        }
        const result = await attemptAdminLogin(email, true);
        return NextResponse.json({
          success: true,
          sessionId: result.sessionId,
          message: 'Emergency force takeover successful. Other session terminated.',
        });
      }

      // 3. Normal login attempt (Strict Lockout check)
      const result = await attemptAdminLogin(email, false);
      if (result.locked) {
        return NextResponse.json({
          success: false,
          locked: true,
          activeSince: result.activeSince,
          message: result.message || 'Host Portal is currently in use by an active administrator.',
        });
      }

      return NextResponse.json({
        success: true,
        sessionId: result.sessionId,
      });
    }

    if (action === 'heartbeat') {
      const sessionId = body.sessionId;
      if (!sessionId) {
        return NextResponse.json({ success: false, valid: false, message: 'Missing session ID' });
      }

      const result = await heartbeatAdminSession(sessionId);
      return NextResponse.json({
        success: true,
        valid: result.valid,
        message: result.message,
      });
    }

    if (action === 'logout') {
      const sessionId = body.sessionId;
      await logoutAdminSession(sessionId);
      return NextResponse.json({ success: true, message: 'Session closed successfully' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
