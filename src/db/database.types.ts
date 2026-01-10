export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      api_cache: {
        Row: {
          cache_key: string
          etag: string | null
          expires_at: string
          fetched_at: string
          last_used_at: string
          payload: Json
          request_fingerprint: string | null
          source: string
          status_code: number | null
        }
        Insert: {
          cache_key: string
          etag?: string | null
          expires_at: string
          fetched_at?: string
          last_used_at?: string
          payload: Json
          request_fingerprint?: string | null
          source: string
          status_code?: number | null
        }
        Update: {
          cache_key?: string
          etag?: string | null
          expires_at?: string
          fetched_at?: string
          last_used_at?: string
          payload?: Json
          request_fingerprint?: string | null
          source?: string
          status_code?: number | null
        }
        Relationships: []
      }
      card_conditions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          is_default: boolean
          label: string
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          is_default?: boolean
          label: string
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          is_default?: boolean
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      card_prices: {
        Row: {
          card_id: string
          created_at: string
          currency_code: string
          high_price: number | null
          last_seen_at: string
          low_price: number | null
          market_price: number
          price_source: string
          source_payload: Json | null
        }
        Insert: {
          card_id: string
          created_at?: string
          currency_code?: string
          high_price?: number | null
          last_seen_at?: string
          low_price?: number | null
          market_price: number
          price_source: string
          source_payload?: Json | null
        }
        Update: {
          card_id?: string
          created_at?: string
          currency_code?: string
          high_price?: number | null
          last_seen_at?: string
          low_price?: number | null
          market_price?: number
          price_source?: string
          source_payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "card_prices_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_prices_price_source_fkey"
            columns: ["price_source"]
            isOneToOne: false
            referencedRelation: "price_sources"
            referencedColumns: ["code"]
          },
        ]
      }
      cards: {
        Row: {
          artist: string | null
          card_number: string
          created_at: string
          external_id: string
          flavor_text: string | null
          hp: number | null
          id: string
          image_large_url: string | null
          image_small_url: string | null
          legalities: Json | null
          name: string
          number_sort: number | null
          rarity_id: string | null
          set_id: string
          subtypes: string[]
          supertype: string | null
          tcg_type: string
          types: string[]
          updated_at: string
        }
        Insert: {
          artist?: string | null
          card_number: string
          created_at?: string
          external_id: string
          flavor_text?: string | null
          hp?: number | null
          id?: string
          image_large_url?: string | null
          image_small_url?: string | null
          legalities?: Json | null
          name: string
          number_sort?: number | null
          rarity_id?: string | null
          set_id: string
          subtypes?: string[]
          supertype?: string | null
          tcg_type: string
          types?: string[]
          updated_at?: string
        }
        Update: {
          artist?: string | null
          card_number?: string
          created_at?: string
          external_id?: string
          flavor_text?: string | null
          hp?: number | null
          id?: string
          image_large_url?: string | null
          image_small_url?: string | null
          legalities?: Json | null
          name?: string
          number_sort?: number | null
          rarity_id?: string | null
          set_id?: string
          subtypes?: string[]
          supertype?: string | null
          tcg_type?: string
          types?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_rarity_id_fkey"
            columns: ["rarity_id"]
            isOneToOne: false
            referencedRelation: "rarities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_tcg_type_fkey"
            columns: ["tcg_type"]
            isOneToOne: false
            referencedRelation: "tcg_types"
            referencedColumns: ["code"]
          },
        ]
      }
      collection_entries: {
        Row: {
          acquired_at: string | null
          card_id: string
          condition_code: string | null
          created_at: string
          id: number
          notes: string | null
          purchase_price: number | null
          quantity: number
          set_id: string
          tcg_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acquired_at?: string | null
          card_id: string
          condition_code?: string | null
          created_at?: string
          id?: never
          notes?: string | null
          purchase_price?: number | null
          quantity: number
          set_id: string
          tcg_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acquired_at?: string | null
          card_id?: string
          condition_code?: string | null
          created_at?: string
          id?: never
          notes?: string | null
          purchase_price?: number | null
          quantity?: number
          set_id?: string
          tcg_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_entries_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_entries_condition_code_fkey"
            columns: ["condition_code"]
            isOneToOne: false
            referencedRelation: "card_conditions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "collection_entries_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_entries_tcg_type_fkey"
            columns: ["tcg_type"]
            isOneToOne: false
            referencedRelation: "tcg_types"
            referencedColumns: ["code"]
          },
        ]
      }
      price_sources: {
        Row: {
          code: string
          created_at: string
          data_url: string | null
          display_name: string
          is_active: boolean
          priority: number
        }
        Insert: {
          code: string
          created_at?: string
          data_url?: string | null
          display_name: string
          is_active?: boolean
          priority?: number
        }
        Update: {
          code?: string
          created_at?: string
          data_url?: string | null
          display_name?: string
          is_active?: boolean
          priority?: number
        }
        Relationships: []
      }
      rarities: {
        Row: {
          created_at: string
          display_name: string
          id: string
          slug: string
          sort_order: number
          tcg_type: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          slug: string
          sort_order?: number
          tcg_type: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          slug?: string
          sort_order?: number
          tcg_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "rarities_tcg_type_fkey"
            columns: ["tcg_type"]
            isOneToOne: false
            referencedRelation: "tcg_types"
            referencedColumns: ["code"]
          },
        ]
      }
      sets: {
        Row: {
          abbreviation: string
          created_at: string
          external_id: string
          id: string
          last_synced_at: string | null
          logo_url: string | null
          name: string
          release_date: string | null
          series: string | null
          symbol_url: string | null
          tcg_type: string
          total_cards: number
          updated_at: string
        }
        Insert: {
          abbreviation: string
          created_at?: string
          external_id: string
          id?: string
          last_synced_at?: string | null
          logo_url?: string | null
          name: string
          release_date?: string | null
          series?: string | null
          symbol_url?: string | null
          tcg_type: string
          total_cards?: number
          updated_at?: string
        }
        Update: {
          abbreviation?: string
          created_at?: string
          external_id?: string
          id?: string
          last_synced_at?: string | null
          logo_url?: string | null
          name?: string
          release_date?: string | null
          series?: string | null
          symbol_url?: string | null
          tcg_type?: string
          total_cards?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sets_tcg_type_fkey"
            columns: ["tcg_type"]
            isOneToOne: false
            referencedRelation: "tcg_types"
            referencedColumns: ["code"]
          },
        ]
      }
      tcg_types: {
        Row: {
          code: string
          created_at: string
          display_name: string
          is_active: boolean
        }
        Insert: {
          code: string
          created_at?: string
          display_name: string
          is_active?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          display_name?: string
          is_active?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

