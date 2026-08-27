export const MORNING_SLOTS = [
  '06:00 AM',
  '07:00 AM',
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
];

export const AFTERNOON_EVENING_SLOTS = [
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM',
  '09:00 PM',
  '10:00 PM',
  '11:00 PM',
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
];
