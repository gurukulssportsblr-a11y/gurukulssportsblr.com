import crypto from 'crypto';
import { createServerClient, isSupabaseConfigured } from '@/lib/supabase/server';

export interface PricingRule {
  id: string;
  rule_name: string;
  start_hour: number;
  end_hour: number;
  price_per_hour: number;
  court_scope: 'ALL' | 'CUSTOM';
  is_active: boolean;
}

export interface BlockedSlot {
  id: string;
  court_number: number; // 0 for ALL courts, 1-11 for specific court
  block_date: string;   // 'YYYY-MM-DD' or 'ALL'
  start_hour: number;   // e.g. 6 (6 AM)
  end_hour: number;     // e.g. 15 (3 PM)
  reason: string;
}

export interface PromoBannerSettings {
  enabled: boolean;
  badge: string;
  headline: string;
  message: string;
  ctaText: string;
  updated_at?: string;
}

export interface AdminSessionRecord {
  sessionId: string;
  userEmail: string;
  role: 'admin' | 'staff';
  startedAt: number;
  lastHeartbeat: number;
}

export interface BookingSlotRecord {
  id?: string;
  booking_id?: string;
  court_id: string;
  court_number: number;
  slot_date: string;
  slot_time: string;
  status: 'booked' | 'cancelled';
  booking_code?: string;
  customer_name?: string;
  customer_phone?: string;
  price?: number;
}

export interface BookingRecord {
  id: string;
  booking_code: string;
  court_number: number;
  court_id: string;
  customer_name: string;
  customer_phone: string;
  booking_date: string;
  slots: string[];
  total_amount: number;
  status: 'confirmed' | 'cancelled';
  created_at: string;
}

const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

// Global in-memory singleton preserved across Next.js API route invocations
const globalStore = global as unknown as {
  _gsPricingRules?: PricingRule[];
  _gsBlockedSlots?: BlockedSlot[];
  _gsPromoBanner?: PromoBannerSettings;
  _gsAdminSession?: AdminSessionRecord | null;
  _gsStaffSession?: AdminSessionRecord | null;
  _gsMockSlots?: BookingSlotRecord[];
  _gsMockBookings?: BookingRecord[];
};

if (!globalStore._gsPricingRules) {
  globalStore._gsPricingRules = [];
}

if (!globalStore._gsBlockedSlots) {
  globalStore._gsBlockedSlots = [];
}

if (!globalStore._gsPromoBanner) {
  globalStore._gsPromoBanner = {
    enabled: false,
    badge: '🎉 SPECIAL OFFER',
    headline: 'Special Discounts Available on Badminton Courts!',
    message: "Enjoy international standard BWF Synthetic courts at Gurukul's Sports Academy Thubrahalli.",
    ctaText: 'Book Court Now',
    updated_at: new Date().toISOString(),
  };
}

if (!globalStore._gsMockSlots) globalStore._gsMockSlots = [];
if (!globalStore._gsMockBookings) globalStore._gsMockBookings = [];

// ==============================================================================
// PRICING RULES HELPER FUNCTIONS
// ==============================================================================
export async function getPricingRules(): Promise<PricingRule[]> {
  if (isSupabaseConfigured) {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data) {
        globalStore._gsPricingRules = data as PricingRule[];
        return data as PricingRule[];
      }
    } catch (err) {
      console.warn('Supabase pricing rules read error:', err);
    }
  }
  return globalStore._gsPricingRules || [];
}

export async function savePricingRule(rule: Omit<PricingRule, 'id'> & { id?: string }): Promise<PricingRule> {
  const ruleId = rule.id && isUUID(rule.id) ? rule.id : crypto.randomUUID();

  const newRule: PricingRule = {
    id: ruleId,
    rule_name: rule.rule_name,
    start_hour: Number(rule.start_hour),
    end_hour: Number(rule.end_hour),
    price_per_hour: Number(rule.price_per_hour),
    court_scope: rule.court_scope || 'ALL',
    is_active: rule.is_active !== undefined ? rule.is_active : true,
  };

  if (!globalStore._gsPricingRules) globalStore._gsPricingRules = [];
  const existingIdx = globalStore._gsPricingRules.findIndex((r) => r.id === newRule.id);
  if (existingIdx >= 0) {
    globalStore._gsPricingRules[existingIdx] = newRule;
  } else {
    globalStore._gsPricingRules.push(newRule);
  }

  if (isSupabaseConfigured) {
    try {
      const supabase = createServerClient();
      await supabase.from('pricing_rules').upsert({
        id: newRule.id,
        rule_name: newRule.rule_name,
        start_hour: newRule.start_hour,
        end_hour: newRule.end_hour,
        price_per_hour: newRule.price_per_hour,
        court_scope: newRule.court_scope,
        is_active: newRule.is_active,
      });
    } catch (err) {
      console.warn('Supabase pricing rule save exception:', err);
    }
  }

  return newRule;
}

export async function deletePricingRule(id: string): Promise<boolean> {
  if (!globalStore._gsPricingRules) return false;
  globalStore._gsPricingRules = globalStore._gsPricingRules.filter((r) => r.id !== id);

  if (isSupabaseConfigured) {
    try {
      const supabase = createServerClient();
      await supabase.from('pricing_rules').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase pricing rule delete error:', err);
    }
  }
  return true;
}

export function calculateSlotPriceFromRules(
  rules: PricingRule[],
  courtNumber: number,
  hour: number
): { price: number; isDiscounted: boolean; ruleName: string } {
  let price = 300;
  let isDiscounted = false;
  let ruleName = '';

  for (const rule of rules) {
    if (!rule.is_active) continue;
    if (hour >= rule.start_hour && hour < rule.end_hour) {
      if (rule.court_scope === 'ALL' || (rule.court_scope === 'CUSTOM' && courtNumber <= 5)) {
        price = Number(rule.price_per_hour);
        isDiscounted = price < 300;
        ruleName = rule.rule_name;
        break;
      }
    }
  }

  return { price, isDiscounted, ruleName };
}

// ==============================================================================
// BLOCKED SLOTS HELPER FUNCTIONS
// ==============================================================================
export async function getBlockedSlots(date?: string): Promise<BlockedSlot[]> {
  if (isSupabaseConfigured) {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'blocked_slots')
        .maybeSingle();

      if (!error && data && Array.isArray(data.value)) {
        const allBlocks = data.value as BlockedSlot[];
        globalStore._gsBlockedSlots = allBlocks;

        if (date) {
          return allBlocks.filter(
            (b) => b.block_date === date || b.block_date === 'ALL' || b.block_date === '2099-12-31'
          );
        }
        return allBlocks;
      }
    } catch (err) {
      console.warn('Supabase blocked slots read error:', err);
    }
  }

  const inMemory = globalStore._gsBlockedSlots || [];
  if (date) {
    return inMemory.filter(
      (b) => b.block_date === date || b.block_date === 'ALL' || b.block_date === '2099-12-31'
    );
  }
  return inMemory;
}

export async function addBlockedSlot(block: Omit<BlockedSlot, 'id'>): Promise<BlockedSlot> {
  const blockId = crypto.randomUUID();
  const newBlock: BlockedSlot = {
    id: blockId,
    ...block,
  };

  if (!globalStore._gsBlockedSlots) globalStore._gsBlockedSlots = [];
  globalStore._gsBlockedSlots.push(newBlock);

  if (isSupabaseConfigured) {
    try {
      const supabase = createServerClient();
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'blocked_slots')
        .maybeSingle();

      const existingBlocks = (data && Array.isArray(data.value)) ? (data.value as BlockedSlot[]) : [];
      const updatedBlocks = [...existingBlocks.filter((b) => b.id !== blockId), newBlock];

      await supabase
        .from('site_settings')
        .upsert({
          key: 'blocked_slots',
          value: updatedBlocks,
          updated_at: new Date().toISOString(),
        });
    } catch (err) {
      console.warn('Supabase blocked slot save error:', err);
    }
  }

  return newBlock;
}

export async function removeBlockedSlot(id: string): Promise<boolean> {
  if (!globalStore._gsBlockedSlots) globalStore._gsBlockedSlots = [];
  globalStore._gsBlockedSlots = globalStore._gsBlockedSlots.filter((b) => b.id !== id);

  if (isSupabaseConfigured) {
    try {
      const supabase = createServerClient();
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'blocked_slots')
        .maybeSingle();

      const existingBlocks = (data && Array.isArray(data.value)) ? (data.value as BlockedSlot[]) : [];
      const updatedBlocks = existingBlocks.filter((b) => b.id !== id);

      await supabase
        .from('site_settings')
        .upsert({
          key: 'blocked_slots',
          value: updatedBlocks,
          updated_at: new Date().toISOString(),
        });
    } catch (err) {
      console.warn('Supabase blocked slot delete error:', err);
    }
  }
  return true;
}

export function isSlotBlocked(
  blocks: BlockedSlot[],
  courtNumber: number,
  date: string,
  hour: number
): { isBlocked: boolean; reason: string } {
  for (const b of blocks) {
    const dateMatches = b.block_date === date || b.block_date === 'ALL' || b.block_date === '2099-12-31';
    const courtMatches = b.court_number === 0 || b.court_number === courtNumber;
    const hourMatches = hour >= b.start_hour && hour < b.end_hour;

    if (dateMatches && courtMatches && hourMatches) {
      return { isBlocked: true, reason: b.reason || 'Court Maintenance' };
    }
  }
  return { isBlocked: false, reason: '' };
}

// ==============================================================================
// PROMO BANNER HELPER FUNCTIONS
// ==============================================================================
export async function getPromoBanner(): Promise<PromoBannerSettings> {
  if (isSupabaseConfigured) {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'promo_banner')
        .single();

      if (!error && data?.value) {
        globalStore._gsPromoBanner = data.value as PromoBannerSettings;
        return data.value as PromoBannerSettings;
      }
    } catch (err) {
      console.warn('Supabase site_settings read error:', err);
    }
  }

  return (
    globalStore._gsPromoBanner || {
      enabled: false,
      badge: '🎉 SPECIAL OFFER',
      headline: 'Special Discounts Available on Badminton Courts!',
      message: "Enjoy international standard BWF Synthetic courts at Gurukul's Sports Academy Thubrahalli.",
      ctaText: 'Book Court Now',
      updated_at: new Date().toISOString(),
    }
  );
}

export async function savePromoBanner(banner: Partial<PromoBannerSettings>): Promise<PromoBannerSettings> {
  const updated: PromoBannerSettings = {
    ...globalStore._gsPromoBanner!,
    ...banner,
    updated_at: new Date().toISOString(),
  };

  globalStore._gsPromoBanner = updated;

  if (isSupabaseConfigured) {
    try {
      const supabase = createServerClient();
      await supabase.from('site_settings').upsert({
        key: 'promo_banner',
        value: updated,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase promo banner save error:', err);
    }
  }

  return updated;
}

// ==============================================================================
// IN-MEMORY / HYBRID REPOSITORY FOR BOOKINGS & SLOTS
// ==============================================================================
export function getMockSlots(): BookingSlotRecord[] {
  return globalStore._gsMockSlots || [];
}

export function addMockSlots(slots: BookingSlotRecord[]) {
  if (!globalStore._gsMockSlots) globalStore._gsMockSlots = [];
  globalStore._gsMockSlots.push(...slots);
}

export function cancelMockSlot(courtNumber: number, date: string, slotTime: string) {
  if (!globalStore._gsMockSlots) return;
  globalStore._gsMockSlots = globalStore._gsMockSlots.filter(
    (s) => !(s.court_number === courtNumber && s.slot_date === date && s.slot_time === slotTime)
  );
}

export function getMockBookings(): BookingRecord[] {
  return globalStore._gsMockBookings || [];
}

export function addMockBooking(booking: BookingRecord) {
  if (!globalStore._gsMockBookings) globalStore._gsMockBookings = [];
  globalStore._gsMockBookings.push(booking);
}

export function cancelMockBooking(idOrCode: string) {
  if (globalStore._gsMockBookings) {
    globalStore._gsMockBookings = globalStore._gsMockBookings.map((b) => {
      if (b.id === idOrCode || b.booking_code === idOrCode) {
        return { ...b, status: 'cancelled' };
      }
      return b;
    });
  }
  if (globalStore._gsMockSlots) {
    globalStore._gsMockSlots = globalStore._gsMockSlots.map((s) => {
      if (s.booking_code === idOrCode || s.booking_id === idOrCode) {
        return { ...s, status: 'cancelled' };
      }
      return s;
    });
  }
}

// ==============================================================================
// PER-USER SINGLE ACTIVE SESSION MANAGEMENT (ONE SESSION PER USER ROLE)
// ==============================================================================
export const ADMIN_SESSION_TIMEOUT_MS = 90_000; // 90 seconds inactivity timeout

export async function getUserActiveSession(role: 'admin' | 'staff'): Promise<AdminSessionRecord | null> {
  const key = role === 'admin' ? 'admin_active_session' : 'staff_active_session';
  const mem = role === 'admin' ? globalStore._gsAdminSession : globalStore._gsStaffSession;

  if (isSupabaseConfigured) {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (!error && data && data.value && data.value.sessionId) {
        const record = data.value as AdminSessionRecord;
        if (role === 'admin') globalStore._gsAdminSession = record;
        else globalStore._gsStaffSession = record;
        return record;
      } else if (!error && data && (!data.value || !data.value.sessionId)) {
        if (role === 'admin') globalStore._gsAdminSession = null;
        else globalStore._gsStaffSession = null;
        return null;
      }
    } catch (err) {
      console.warn(`Supabase ${role} session read error:`, err);
    }
  }
  return mem || null;
}

export async function saveUserSession(role: 'admin' | 'staff', session: AdminSessionRecord | null): Promise<void> {
  const key = role === 'admin' ? 'admin_active_session' : 'staff_active_session';
  if (role === 'admin') {
    globalStore._gsAdminSession = session;
  } else {
    globalStore._gsStaffSession = session;
  }

  if (isSupabaseConfigured) {
    try {
      const supabase = createServerClient();
      await supabase.from('site_settings').upsert({
        key,
        value: session || {},
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn(`Supabase ${role} session save error:`, err);
    }
  }
}

export async function attemptUserLogin(
  email: string,
  role: 'admin' | 'staff',
  forceOvertake: boolean = false
): Promise<{
  success: boolean;
  sessionId?: string;
  role?: 'admin' | 'staff';
  locked?: boolean;
  activeSince?: number;
  message?: string;
}> {
  const current = await getUserActiveSession(role);
  const now = Date.now();

  const isCurrentActive =
    current &&
    current.sessionId &&
    typeof current.lastHeartbeat === 'number' &&
    now - current.lastHeartbeat < ADMIN_SESSION_TIMEOUT_MS;

  if (isCurrentActive && !forceOvertake) {
    const accountName = role === 'admin' ? 'Administrator (gurukulssportsblr@gmail.com)' : 'Staff (staff)';
    return {
      success: false,
      locked: true,
      role,
      activeSince: current.startedAt,
      message: `${accountName} is currently active on another device or browser. Only one concurrent session is permitted for this user.`,
    };
  }

  const newSession: AdminSessionRecord = {
    sessionId: crypto.randomUUID(),
    userEmail: email,
    role,
    startedAt: now,
    lastHeartbeat: now,
  };

  await saveUserSession(role, newSession);
  return { success: true, sessionId: newSession.sessionId, role: newSession.role };
}

export async function heartbeatUserSession(
  sessionId: string,
  role?: 'admin' | 'staff'
): Promise<{ valid: boolean; role?: 'admin' | 'staff'; message?: string }> {
  let targetRole: 'admin' | 'staff' | null = role || null;
  let current: AdminSessionRecord | null = null;

  if (targetRole) {
    current = await getUserActiveSession(targetRole);
  } else {
    const adminSess = await getUserActiveSession('admin');
    if (adminSess && adminSess.sessionId === sessionId) {
      targetRole = 'admin';
      current = adminSess;
    } else {
      const staffSess = await getUserActiveSession('staff');
      if (staffSess && staffSess.sessionId === sessionId) {
        targetRole = 'staff';
        current = staffSess;
      }
    }
  }

  if (!current || !current.sessionId || current.sessionId !== sessionId || !targetRole) {
    return {
      valid: false,
      message: 'Your session has ended because another session took over or logged out on this account.',
    };
  }

  current.lastHeartbeat = Date.now();
  await saveUserSession(targetRole, current);
  return { valid: true, role: current.role || targetRole };
}

export async function logoutUserSession(sessionId?: string, role?: 'admin' | 'staff'): Promise<void> {
  if (role) {
    const current = await getUserActiveSession(role);
    if (!sessionId || (current && current.sessionId === sessionId)) {
      await saveUserSession(role, null);
    }
    return;
  }

  const adminSess = await getUserActiveSession('admin');
  if (!sessionId || (adminSess && adminSess.sessionId === sessionId)) {
    await saveUserSession('admin', null);
  }
  const staffSess = await getUserActiveSession('staff');
  if (!sessionId || (staffSess && staffSess.sessionId === sessionId)) {
    await saveUserSession('staff', null);
  }
}

// Backward compatibility helpers
export async function getAdminActiveSession(): Promise<AdminSessionRecord | null> {
  return getUserActiveSession('admin');
}
export async function saveAdminSession(session: AdminSessionRecord | null): Promise<void> {
  return saveUserSession('admin', session);
}
export async function attemptAdminLogin(email: string, forceOvertake: boolean = false, role: 'admin' | 'staff' = 'admin') {
  return attemptUserLogin(email, role, forceOvertake);
}
export async function heartbeatAdminSession(sessionId: string, role?: 'admin' | 'staff') {
  return heartbeatUserSession(sessionId, role);
}
export async function logoutAdminSession(sessionId?: string, role?: 'admin' | 'staff') {
  return logoutUserSession(sessionId, role);
}

export async function assertAdminPrivilege(sessionId?: string): Promise<{ authorized: boolean; error?: string }> {
  if (sessionId) {
    const staff = await getUserActiveSession('staff');
    if (staff && staff.sessionId === sessionId) {
      return {
        authorized: false,
        error: 'Access denied: Staff accounts are restricted to viewing bookings only.',
      };
    }
  }
  return { authorized: true };
}

