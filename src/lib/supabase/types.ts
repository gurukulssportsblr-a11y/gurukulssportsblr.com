export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      courts: {
        Row: {
          id: string;
          court_number: number;
          name: string;
          surface_type: 'Synthetic' | 'Wooden';
          price_per_hour: number;
          is_active: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          court_number: number;
          name: string;
          surface_type?: 'Synthetic' | 'Wooden';
          price_per_hour?: number;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          court_number?: number;
          name?: string;
          surface_type?: 'Synthetic' | 'Wooden';
          price_per_hour?: number;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          booking_code: string;
          court_id: string;
          customer_name: string;
          customer_phone: string;
          booking_date: string;
          frequency: 'one-time' | 'daily' | 'weekly_weekends' | 'weekly_sameday';
          repeat_until: string | null;
          total_hours: number;
          price_per_hour: number;
          total_amount: number;
          status: 'confirmed' | 'cancelled';
          created_at: string;
          cancelled_at: string | null;
        };
        Insert: {
          id?: string;
          booking_code: string;
          court_id: string;
          customer_name: string;
          customer_phone: string;
          booking_date: string;
          frequency?: 'one-time' | 'daily' | 'weekly_weekends' | 'weekly_sameday';
          repeat_until?: string | null;
          total_hours: number;
          price_per_hour: number;
          total_amount: number;
          status?: 'confirmed' | 'cancelled';
          created_at?: string;
          cancelled_at?: string | null;
        };
        Update: {
          id?: string;
          booking_code?: string;
          court_id?: string;
          customer_name?: string;
          customer_phone?: string;
          booking_date?: string;
          frequency?: 'one-time' | 'daily' | 'weekly_weekends' | 'weekly_sameday';
          repeat_until?: string | null;
          total_hours?: number;
          price_per_hour?: number;
          total_amount?: number;
          status?: 'confirmed' | 'cancelled';
          created_at?: string;
          cancelled_at?: string | null;
        };
      };
      booking_slots: {
        Row: {
          id: string;
          booking_id: string;
          court_id: string;
          slot_date: string;
          slot_time: string;
          status: 'booked' | 'cancelled';
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          court_id: string;
          slot_date: string;
          slot_time: string;
          status?: 'booked' | 'cancelled';
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          court_id?: string;
          slot_date?: string;
          slot_time?: string;
          status?: 'booked' | 'cancelled';
          created_at?: string;
        };
      };
    };
  };
}

export type Court = Database['public']['Tables']['courts']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type BookingSlot = Database['public']['Tables']['booking_slots']['Row'];
