export const MORNING_SLOTS = [
  '06:00 AM',
  '06:30 AM',
  '07:00 AM',
  '07:30 AM',
  '08:00 AM',
  '08:30 AM',
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:30 AM',
];

export const AFTERNOON_EVENING_SLOTS = [
  '12:00 PM',
  '12:30 PM',
  '01:00 PM',
  '01:30 PM',
  '02:00 PM',
  '02:30 PM',
  '03:00 PM',
  '03:30 PM',
  '04:00 PM',
  '04:30 PM',
  '05:00 PM',
  '05:30 PM',
  '06:00 PM',
  '06:30 PM',
  '07:00 PM',
  '07:30 PM',
  '08:00 PM',
  '08:30 PM',
  '09:00 PM',
  '09:30 PM',
  '10:00 PM',
  '10:30 PM',
  '11:00 PM',
  '11:30 PM',
];

export const ALL_TIME_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_EVENING_SLOTS];

export interface DefaultCourt {
  id: string;
  court_number: number;
  name: string;
  surface_type: 'Synthetic' | 'Wooden';
  price_per_hour: number;
}

export const DEFAULT_COURTS: DefaultCourt[] = [
  { id: 'c1', court_number: 1, name: 'Court 1', surface_type: 'Synthetic', price_per_hour: 300 },
  { id: 'c2', court_number: 2, name: 'Court 2', surface_type: 'Synthetic', price_per_hour: 300 },
  { id: 'c3', court_number: 3, name: 'Court 3', surface_type: 'Synthetic', price_per_hour: 300 },
  { id: 'c4', court_number: 4, name: 'Court 4', surface_type: 'Synthetic', price_per_hour: 300 },
  { id: 'c5', court_number: 5, name: 'Court 5', surface_type: 'Synthetic', price_per_hour: 300 },
  { id: 'c6', court_number: 6, name: 'Court 6', surface_type: 'Synthetic', price_per_hour: 300 },
  { id: 'c7', court_number: 7, name: 'Court 7', surface_type: 'Synthetic', price_per_hour: 300 },
  { id: 'c8', court_number: 8, name: 'Court 8', surface_type: 'Synthetic', price_per_hour: 300 },
  { id: 'c9', court_number: 9, name: 'Court 9', surface_type: 'Synthetic', price_per_hour: 300 },
  { id: 'c10', court_number: 10, name: 'Court 10', surface_type: 'Synthetic', price_per_hour: 300 },
  { id: 'c11', court_number: 11, name: 'Court 11', surface_type: 'Synthetic', price_per_hour: 300 },
];

export function normalizeSlot(s: string): string {
  if (!s) return '';
  return s.trim().replace(/^0/, '').toUpperCase();
}

export function parseSlotToHour(slotStr: string): number {
  const match = slotStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let hour = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10) || 0;
  const period = match[3].toUpperCase();
  if (period === 'PM' && hour < 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return hour + minutes / 60;
}

export function getNowInIST(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 5.5);
}

export function isSlotPassed(slotStr: string, dateStr: string): boolean {
  try {
    const istNow = getNowInIST();
    const year = istNow.getFullYear();
    const month = String(istNow.getMonth() + 1).padStart(2, '0');
    const day = String(istNow.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    if (dateStr < todayStr) return true;
    if (dateStr > todayStr) return false;

    // For today, compare decimal hour with current decimal time in IST
    const slotHour = parseSlotToHour(slotStr);
    const currentDecimalHour = istNow.getHours() + istNow.getMinutes() / 60;
    return slotHour <= currentDecimalHour;
  } catch {
    return false;
  }
}

export function formatDecimalToTime(decimalHour: number): string {
  if (decimalHour >= 24 || decimalHour === 0) return '12:00 AM';
  const hours = Math.floor(decimalHour);
  const minutes = Math.round((decimalHour - hours) * 60);
  const period = hours >= 12 && hours < 24 ? 'PM' : 'AM';
  let displayHour = hours % 12;
  if (displayHour === 0) displayHour = 12;
  const padHour = String(displayHour).padStart(2, '0');
  const padMin = String(minutes).padStart(2, '0');
  return `${padHour}:${padMin} ${period}`;
}

export interface DurationOption {
  value: number; // in hours: 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0
  label: string;
  sublabel: string;
  slotsCount: number;
}

export const DURATION_OPTIONS: DurationOption[] = [
  { value: 0.5, label: '30 Mins', sublabel: '0.5 hr', slotsCount: 1 },
  { value: 1.0, label: '1 Hour', sublabel: '60 mins', slotsCount: 2 },
  { value: 1.5, label: '1.5 Hours', sublabel: '90 mins', slotsCount: 3 },
  { value: 2.0, label: '2 Hours', sublabel: '120 mins', slotsCount: 4 },
  { value: 2.5, label: '2.5 Hours', sublabel: '150 mins', slotsCount: 5 },
  { value: 3.0, label: '3 Hours', sublabel: '180 mins', slotsCount: 6 },
  { value: 3.5, label: '3.5 Hours', sublabel: '210 mins', slotsCount: 7 },
  { value: 4.0, label: '4 Hours', sublabel: '240 mins', slotsCount: 8 },
];

export interface TimeWindow {
  id: string;
  startTime: string;
  endTime: string;
  startHour: number;
  endHour: number;
  label: string;
  slots: string[];
  isMorning: boolean;
}

export function generateTimeWindows(durationHours: number): TimeWindow[] {
  const slotsCount = Math.round(durationHours / 0.5);
  const windows: TimeWindow[] = [];
  if (slotsCount < 1 || slotsCount > ALL_TIME_SLOTS.length) return windows;

  for (let i = 0; i <= ALL_TIME_SLOTS.length - slotsCount; i++) {
    const startSlot = ALL_TIME_SLOTS[i];
    const startHour = parseSlotToHour(startSlot);
    const endHour = startHour + durationHours;
    if (endHour > 24) continue; // Arena closes at 12:00 AM Midnight

    const endTime = formatDecimalToTime(endHour);
    const windowSlots = ALL_TIME_SLOTS.slice(i, i + slotsCount);
    windows.push({
      id: `${startSlot}-${endTime}`,
      startTime: startSlot,
      endTime,
      startHour,
      endHour,
      label: `${startSlot} – ${endTime}`,
      slots: windowSlots,
      isMorning: startHour < 12,
    });
  }

  return windows;
}
