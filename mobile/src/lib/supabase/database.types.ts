// Dibuat dari skema project Supabase `duit` (generate_typescript_types). Buat ulang setiap kali migrasi berubah.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null;
          completed_count: number;
          created_at: string;
          display_name: string;
          id: string;
          rating_avg: number;
          rating_count: number;
        };
        Insert: never;
        Update: { avatar_url?: string | null; display_name?: string };
        Relationships: [];
      };
      task_events: {
        Row: {
          actor_id: string | null;
          created_at: string;
          id: number;
          payload: Json;
          task_id: string;
          type: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      tasks: {
        Row: {
          accepted_at: string | null;
          address_text: string;
          arrived_at: string | null;
          cancelled_at: string | null;
          category: string;
          created_at: string;
          description: string;
          doer_id: string | null;
          enroute_at: string | null;
          id: string;
          location: unknown;
          payment_mode: string;
          poster_id: string;
          price_idr: number;
          released_at: string | null;
          skill_tags: string[];
          status: string;
          submitted_at: string | null;
          title: string;
          updated_at: string;
          urgent: boolean;
          working_at: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      accept_task: {
        Args: { p_lat: number; p_lng: number; p_task_id: string };
        Returns: undefined;
      };
      cancel_task: { Args: { p_task_id: string }; Returns: undefined };
      create_task: {
        Args: {
          p_address: string;
          p_category: string;
          p_description: string;
          p_lat: number;
          p_lng: number;
          p_price_idr: number;
          p_skill_tags?: string[];
          p_title: string;
          p_urgent: boolean;
        };
        Returns: string;
      };
      nearby_tasks: {
        Args: { p_lat: number; p_limit?: number; p_lng: number; p_radius_m?: number };
        Returns: {
          approx_lat: number;
          approx_lng: number;
          category: string;
          created_at: string;
          description: string;
          distance_m: number;
          id: string;
          poster_completed: number;
          poster_name: string;
          poster_rating: number;
          price_idr: number;
          skill_tags: string[];
          title: string;
          urgent: boolean;
        }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
