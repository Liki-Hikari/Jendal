export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: 'buyer' | 'seller' | 'admin';
          approved: boolean;
          disabled: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          role: 'buyer' | 'seller' | 'admin';
          approved?: boolean;
          disabled?: boolean;
          created_at?: string | null;
        };
        Update: {
          full_name?: string;
          email?: string;
          role?: 'buyer' | 'seller' | 'admin';
          approved?: boolean;
          disabled?: boolean;
          created_at?: string | null;
        };
      };
      products: {
        Row: {
          id: string;
          seller_id: string;
          name: string;
          category: string;
          description: string;
          price: number;
          location: string;
          quantity: number;
          units_sold: number;
          sales_total: number;
          status: 'available' | 'sold_out';
          image_url: string;
          sold_out_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          seller_id: string;
          name: string;
          category: string;
          description: string;
          price: number;
          location: string;
          quantity?: number;
          units_sold?: number;
          sales_total?: number;
          status?: 'available' | 'sold_out';
          image_url: string;
          sold_out_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          seller_id?: string;
          name?: string;
          category?: string;
          description?: string;
          price?: number;
          location?: string;
          quantity?: number;
          units_sold?: number;
          sales_total?: number;
          status?: 'available' | 'sold_out';
          image_url?: string;
          sold_out_at?: string | null;
          created_at?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string | null;
          product_id: string | null;
          subject: string | null;
          body: string;
          broadcast: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id?: string | null;
          product_id?: string | null;
          subject?: string | null;
          body: string;
          broadcast?: boolean;
          created_at?: string | null;
        };
        Update: {
          sender_id?: string;
          recipient_id?: string | null;
          product_id?: string | null;
          subject?: string | null;
          body?: string;
          broadcast?: boolean;
          created_at?: string | null;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
