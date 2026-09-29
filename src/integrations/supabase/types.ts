export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      character_conditions: {
        Row: {
          applied_at: string
          character_id: number
          condition_id: number
          duration: string
          id: number
        }
        Insert: {
          applied_at?: string
          character_id: number
          condition_id: number
          duration?: string
          id?: number
        }
        Update: {
          applied_at?: string
          character_id?: number
          condition_id?: number
          duration?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_conditions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_conditions_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "conditions"
            referencedColumns: ["id"]
          },
        ]
      }
      character_effects: {
        Row: {
          applied_at: string
          character_id: number
          duration: string
          effect_id: number
          id: number
        }
        Insert: {
          applied_at?: string
          character_id: number
          duration?: string
          effect_id: number
          id?: number
        }
        Update: {
          applied_at?: string
          character_id?: number
          duration?: string
          effect_id?: number
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "character_effects_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_effects_effect_id_fkey"
            columns: ["effect_id"]
            isOneToOne: false
            referencedRelation: "effects"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          age: number
          agility: number
          backstory: string
          class_name: string
          created_at: string
          created_by: string
          hp: number
          hp_max: number
          id: number
          intelligence: number
          mana: number
          mana_max: number
          name: string
          notes: string
          presence: number
          race: string
          resistance: number
          stamina: number
          stamina_max: number
          strength: number
          table_id: number | null
          unspent_points: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          age: number
          agility?: number
          backstory?: string
          class_name: string
          created_at?: string
          created_by: string
          hp?: number
          hp_max?: number
          id?: number
          intelligence?: number
          mana?: number
          mana_max?: number
          name: string
          notes?: string
          presence?: number
          race: string
          resistance?: number
          stamina?: number
          stamina_max?: number
          strength?: number
          table_id?: number | null
          unspent_points?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          age?: number
          agility?: number
          backstory?: string
          class_name?: string
          created_at?: string
          created_by?: string
          hp?: number
          hp_max?: number
          id?: number
          intelligence?: number
          mana?: number
          mana_max?: number
          name?: string
          notes?: string
          presence?: number
          race?: string
          resistance?: number
          stamina?: number
          stamina_max?: number
          strength?: number
          table_id?: number | null
          unspent_points?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "game_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      conditions: {
        Row: {
          color: string
          created_at: string
          description: string
          effect: string
          icon: string
          id: number
          modifiers: Json
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string
          effect?: string
          icon?: string
          id?: number
          modifiers?: Json
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          effect?: string
          icon?: string
          id?: number
          modifiers?: Json
          name?: string
        }
        Relationships: []
      }
      custom_icons: {
        Row: {
          category: string
          created_at: string
          created_by: string
          id: number
          key: string
          label: string
          url: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          id?: number
          key: string
          label: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          id?: number
          key?: string
          label?: string
          url?: string
        }
        Relationships: []
      }
      dice_rolls: {
        Row: {
          character_id: number | null
          created_at: string
          id: number
          roller_name: string
          table_id: number | null
          user_id: string
          value: number
        }
        Insert: {
          character_id?: number | null
          created_at?: string
          id?: number
          roller_name: string
          table_id?: number | null
          user_id: string
          value: number
        }
        Update: {
          character_id?: number | null
          created_at?: string
          id?: number
          roller_name?: string
          table_id?: number | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "dice_rolls_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dice_rolls_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "game_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      effects: {
        Row: {
          color: string
          created_at: string
          description: string
          icon: string
          id: number
          kind: string
          modifiers: Json
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: number
          kind: string
          modifiers?: Json
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: number
          kind?: string
          modifiers?: Json
          name?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          category: string
          created_at: string
          description: string
          effects: string
          icon: string
          id: number
          modifiers: Json
          name: string
          rarity: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string
          effects?: string
          icon?: string
          id?: number
          modifiers?: Json
          name: string
          rarity?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          effects?: string
          icon?: string
          id?: number
          modifiers?: Json
          name?: string
          rarity?: string
          updated_at?: string
        }
        Relationships: []
      }
      game_tables: {
        Row: {
          created_at: string
          gm_user_id: string
          id: number
          name: string
        }
        Insert: {
          created_at?: string
          gm_user_id: string
          id?: number
          name?: string
        }
        Update: {
          created_at?: string
          gm_user_id?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      hidden_icons: {
        Row: {
          created_at: string
          key: string
        }
        Insert: {
          created_at?: string
          key: string
        }
        Update: {
          created_at?: string
          key?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          character_id: number
          created_at: string
          description: string
          equipment_id: number | null
          equipped_slot: string | null
          id: number
          kind: string
          name: string
          quantity: number
        }
        Insert: {
          character_id: number
          created_at?: string
          description?: string
          equipment_id?: number | null
          equipped_slot?: string | null
          id?: number
          kind: string
          name: string
          quantity?: number
        }
        Update: {
          character_id?: number
          created_at?: string
          description?: string
          equipment_id?: number | null
          equipped_slot?: string | null
          id?: number
          kind?: string
          name?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      exec_sql: { Args: { q: string; returns_rows?: boolean }; Returns: Json }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
