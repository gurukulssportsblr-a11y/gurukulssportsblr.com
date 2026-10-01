export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import {
  attemptUserLogin,
  heartbeatUserSession,
  logoutUserSession,
  getUserActiveSession,
  ADMIN_SESSION_TIMEOUT_MS,
} from '@/lib/server-store';

const ADMIN_EMAIL = 'gurukulssportsblr@gmail.com';
const ADMIN_PASSWORD = 'G#r#kul$Sp0rt$@blr';
const EMERGENCY_OVERRIDE_PASSWORD = 'Ace_V1j1th';

const STAFF_USERNAME = 'staff';
const STAFF_PASSWORD = 'St@ff@Gurukul$';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const role = (searchParams.get('role') || 'admin') as 'admin' | 'staff';
    const current = await getUserActiveSession(role);
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
      role,
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

      const normalized = email.toLowerCase();
      let role: 'admin' | 'staff' | null = null;

      if (
        (normalized === ADMIN_EMAIL.toLowerCase() || normalized === 'admin') &&
        password === ADMIN_PASSWORD
      ) {
        role = 'admin';
      } else if (
        (normalized === STAFF_USERNAME.toLowerCase() || normalized === 'staff@gurukulssportsblr.com') &&
        password === STAFF_PASSWORD
      ) {
        role = 'staff';
      }

      // 1. Verify credentials
      if (!role) {
        return NextResponse.json(
          { success: false, error: 'Invalid email/username or password.' },
          { status: 401 }
        );
      }

      // 2. Handle override / takeover (Per-User session termination)
      if (forceOvertake) {
        // If an override password was provided, verify it if admin
        if (role === 'admin' && forceOvertakePassword && forceOvertakePassword !== EMERGENCY_OVERRIDE_PASSWORD) {
          return NextResponse.json(
            { success: false, error: 'Incorrect Emergency Override Password.' },
            { status: 401 }
          );
        }

        const result = await attemptUserLogin(email, role, true);
        return NextResponse.json({
          success: true,
          sessionId: result.sessionId,
          role: result.role,
          message: `${role === 'admin' ? 'Administrator' : 'Staff'} session override successful. Previous session terminated.`,
        });
      }

      // 3. Normal login attempt (Per-User Concurrent Session Lockout)
      const result = await attemptUserLogin(email, role, false);
      if (result.locked) {
        return NextResponse.json({
          success: false,
          locked: true,
          role: result.role,
          activeSince: result.activeSince,
          message: result.message || `${role === 'admin' ? 'Administrator' : 'Staff'} account is currently active on another device.`,
        });
      }

      return NextResponse.json({
        success: true,
        sessionId: result.sessionId,
        role: result.role,
      });
    }

    if (action === 'heartbeat') {
      const sessionId = body.sessionId;
      const role = body.role as 'admin' | 'staff' | undefined;
      if (!sessionId) {
        return NextResponse.json({ success: false, valid: false, message: 'Missing session ID' });
      }

      const result = await heartbeatUserSession(sessionId, role);
      return NextResponse.json({
        success: true,
        valid: result.valid,
        role: result.role,
        message: result.message,
      });
    }

    if (action === 'logout') {
      const sessionId = body.sessionId;
      const role = body.role as 'admin' | 'staff' | undefined;
      await logoutUserSession(sessionId, role);
      return NextResponse.json({ success: true, message: 'Session closed successfully' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
