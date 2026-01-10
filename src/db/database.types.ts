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
          endpoint_key: string
          expires_at: string
          fetched_at: string
          id: string
          payload: Json
        }
        Insert: {
          endpoint_key: string
          expires_at: string
          fetched_at?: string
          id?: string
          payload: Json
        }
        Update: {
          endpoint_key?: string
          expires_at?: string
          fetched_at?: string
          id?: string
          payload?: Json
        }
        Relationships: []
      }
      card_conditions: {
        Row: {
          code: string
          id: number
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          id?: never
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          id?: never
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      card_prices: {
        Row: {
          card_id: string
          currency: string
          fetched_at: string
          id: string
          price: number | null
          price_source_id: number
          price_type: string
        }
        Insert: {
          card_id: string
          currency?: string
          fetched_at?: string
          id?: string
          price?: number | null
          price_source_id: number
          price_type?: string
        }
        Update: {
          card_id?: string
          currency?: string
          fetched_at?: string
          id?: string
          price?: number | null
          price_source_id?: number
          price_type?: string
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
            foreignKeyName: "card_prices_price_source_id_fkey"
            columns: ["price_source_id"]
            isOneToOne: false
            referencedRelation: "price_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          abilities: Json | null
          api_data_fetched: boolean
          artist: string | null
          attacks: Json | null
          card_number: string
          card_type: string | null
          created_at: string
          evolves_from: string | null
          external_id: string
          flavor_text: string | null
          hp: number | null
          id: string
          image_large_url: string | null
          image_small_url: string | null
          name: string
          rarity_id: number | null
          resistances: Json | null
          retreat_cost: string[] | null
          rules: string[] | null
          set_id: string
          subtypes: string[] | null
          supertype: string | null
          tcg_type_id: number
          types: string[] | null
          updated_at: string
          weaknesses: Json | null
        }
        Insert: {
          abilities?: Json | null
          api_data_fetched?: boolean
          artist?: string | null
          attacks?: Json | null
          card_number: string
          card_type?: string | null
          created_at?: string
          evolves_from?: string | null
          external_id: string
          flavor_text?: string | null
          hp?: number | null
          id?: string
          image_large_url?: string | null
          image_small_url?: string | null
          name: string
          rarity_id?: number | null
          resistances?: Json | null
          retreat_cost?: string[] | null
          rules?: string[] | null
          set_id: string
          subtypes?: string[] | null
          supertype?: string | null
          tcg_type_id: number
          types?: string[] | null
          updated_at?: string
          weaknesses?: Json | null
        }
        Update: {
          abilities?: Json | null
          api_data_fetched?: boolean
          artist?: string | null
          attacks?: Json | null
          card_number?: string
          card_type?: string | null
          created_at?: string
          evolves_from?: string | null
          external_id?: string
          flavor_text?: string | null
          hp?: number | null
          id?: string
          image_large_url?: string | null
          image_small_url?: string | null
          name?: string
          rarity_id?: number | null
          resistances?: Json | null
          retreat_cost?: string[] | null
          rules?: string[] | null
          set_id?: string
          subtypes?: string[] | null
          supertype?: string | null
          tcg_type_id?: number
          types?: string[] | null
          updated_at?: string
          weaknesses?: Json | null
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
            referencedRelation: "collection_set_summary"
            referencedColumns: ["set_id"]
          },
          {
            foreignKeyName: "cards_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_tcg_type_id_fkey"
            columns: ["tcg_type_id"]
            isOneToOne: false
            referencedRelation: "tcg_types"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_entries: {
        Row: {
          card_id: string
          condition_id: number
          created_at: string
          grade_value: number | null
          grading_company_id: number | null
          id: string
          notes: string | null
          purchase_price: number | null
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          condition_id: number
          created_at?: string
          grade_value?: number | null
          grading_company_id?: number | null
          id?: string
          notes?: string | null
          purchase_price?: number | null
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          card_id?: string
          condition_id?: number
          created_at?: string
          grade_value?: number | null
          grading_company_id?: number | null
          id?: string
          notes?: string | null
          purchase_price?: number | null
          quantity?: number
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
            foreignKeyName: "collection_entries_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "card_conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_entries_grading_company_id_fkey"
            columns: ["grading_company_id"]
            isOneToOne: false
            referencedRelation: "grading_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_companies: {
        Row: {
          code: string
          id: number
          max_grade: number
          min_grade: number
          name: string
        }
        Insert: {
          code: string
          id?: never
          max_grade?: number
          min_grade?: number
          name: string
        }
        Update: {
          code?: string
          id?: never
          max_grade?: number
          min_grade?: number
          name?: string
        }
        Relationships: []
      }
      import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_details: Json | null
          failure_count: number
          id: string
          job_type: string
          started_at: string | null
          status: string
          success_count: number
          total_records: number
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          failure_count?: number
          id?: string
          job_type: string
          started_at?: string | null
          status?: string
          success_count?: number
          total_records?: number
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_details?: Json | null
          failure_count?: number
          id?: string
          job_type?: string
          started_at?: string | null
          status?: string
          success_count?: number
          total_records?: number
          triggered_by?: string | null
        }
        Relationships: []
      }
      list_entries: {
        Row: {
          collection_entry_id: string
          created_at: string
          id: string
          list_id: string
        }
        Insert: {
          collection_entry_id: string
          created_at?: string
          id?: string
          list_id: string
        }
        Update: {
          collection_entry_id?: string
          created_at?: string
          id?: string
          list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_entries_collection_entry_id_fkey"
            columns: ["collection_entry_id"]
            isOneToOne: false
            referencedRelation: "collection_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_entries_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "user_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      price_sources: {
        Row: {
          code: string
          id: number
          name: string
          url: string | null
        }
        Insert: {
          code: string
          id?: never
          name: string
          url?: string | null
        }
        Update: {
          code?: string
          id?: never
          name?: string
          url?: string | null
        }
        Relationships: []
      }
      rarities: {
        Row: {
          code: string
          id: number
          name: string
          sort_order: number
          tcg_type_id: number
        }
        Insert: {
          code: string
          id?: never
          name: string
          sort_order?: number
          tcg_type_id: number
        }
        Update: {
          code?: string
          id?: never
          name?: string
          sort_order?: number
          tcg_type_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "rarities_tcg_type_id_fkey"
            columns: ["tcg_type_id"]
            isOneToOne: false
            referencedRelation: "tcg_types"
            referencedColumns: ["id"]
          },
        ]
      }
      sets: {
        Row: {
          created_at: string
          external_id: string
          id: string
          logo_url: string | null
          name: string
          release_date: string | null
          series: string | null
          symbol_url: string | null
          tcg_type_id: number
          total_cards: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_id: string
          id?: string
          logo_url?: string | null
          name: string
          release_date?: string | null
          series?: string | null
          symbol_url?: string | null
          tcg_type_id: number
          total_cards?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_id?: string
          id?: string
          logo_url?: string | null
          name?: string
          release_date?: string | null
          series?: string | null
          symbol_url?: string | null
          tcg_type_id?: number
          total_cards?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sets_tcg_type_id_fkey"
            columns: ["tcg_type_id"]
            isOneToOne: false
            referencedRelation: "tcg_types"
            referencedColumns: ["id"]
          },
        ]
      }
      tcg_types: {
        Row: {
          code: string
          created_at: string
          id: number
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: never
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: never
          name?: string
        }
        Relationships: []
      }
      user_lists: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          display_name: string | null
          id: string
          is_admin: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          id: string
          is_admin?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          id?: string
          is_admin?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      collection_set_summary: {
        Row: {
          completion_percentage: number | null
          owned_total_cards: number | null
          owned_unique_cards: number | null
          set_id: string | null
          set_name: string | null
          set_total_cards: number | null
          user_id: string | null
        }
        Relationships: []
      }
      collection_value_view: {
        Row: {
          total_cards: number | null
          total_entries: number | null
          total_market_value: number | null
          total_profit_loss: number | null
          total_purchase_cost: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_api_cache: { Args: never; Returns: number }
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

