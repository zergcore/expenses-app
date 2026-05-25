export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      login_events: {
        Row: {
          id: string;
          user_id: string;
          event_type: "sign_in" | "failed_attempt" | "password_change" | "security_action";
          ip_address: string | null;
          country_code: string | null;
          user_agent: string | null;
          is_suspicious: boolean;
          reason: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type: "sign_in" | "failed_attempt" | "password_change" | "security_action";
          ip_address?: string | null;
          country_code?: string | null;
          user_agent?: string | null;
          is_suspicious?: boolean;
          reason?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_type?: "sign_in" | "failed_attempt" | "password_change" | "security_action";
          ip_address?: string | null;
          country_code?: string | null;
          user_agent?: string | null;
          is_suspicious?: boolean;
          reason?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "login_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      support_tickets: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string;
          subject: string;
          message: string;
          ip_address: string | null;
          user_agent: string | null;
          status: "open" | "in_progress" | "resolved" | "spam";
          locale: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          email: string;
          subject: string;
          message: string;
          ip_address?: string | null;
          user_agent?: string | null;
          status?: "open" | "in_progress" | "resolved" | "spam";
          locale?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          email?: string;
          subject?: string;
          message?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          status?: "open" | "in_progress" | "resolved" | "spam";
          locale?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      budgets: {
        Row: {
          amount: number;
          category_id: string | null;
          created_at: string | null;
          currency: string | null;
          end_date: string | null;
          id: string;
          period: string | null;
          start_date: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          category_id?: string | null;
          created_at?: string | null;
          currency?: string | null;
          end_date?: string | null;
          id?: string;
          period?: string | null;
          start_date: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          category_id?: string | null;
          created_at?: string | null;
          currency?: string | null;
          end_date?: string | null;
          id?: string;
          period?: string | null;
          start_date?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budgets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          color: string | null;
          created_at: string | null;
          icon: string | null;
          id: string;
          is_default: boolean | null;
          name: string;
          parent_id: string | null;
          user_id: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          icon?: string | null;
          id?: string;
          is_default?: boolean | null;
          name: string;
          parent_id?: string | null;
          user_id: string;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          icon?: string | null;
          id?: string;
          is_default?: boolean | null;
          name?: string;
          parent_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "categories_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      exchange_rates: {
        Row: {
          fetched_at: string | null;
          id: string;
          pair: string;
          rate: number;
          source: string;
        };
        Insert: {
          fetched_at?: string | null;
          id?: string;
          pair: string;
          rate: number;
          source: string;
        };
        Update: {
          fetched_at?: string | null;
          id?: string;
          pair?: string;
          rate?: number;
          source?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          amount: number;
          amount_usd: number | null;
          category_id: string | null;
          created_at: string | null;
          currency: string;
          date: string;
          description: string | null;
          equivalents: Json | null;
          exchange_rate: number | null;
          id: string;
          is_recurring: boolean | null;
          rates_at_creation: Json | null;
          receipt_id: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          amount_usd?: number | null;
          category_id?: string | null;
          created_at?: string | null;
          currency: string;
          date?: string;
          description?: string | null;
          equivalents?: Json | null;
          exchange_rate?: number | null;
          id?: string;
          is_recurring?: boolean | null;
          rates_at_creation?: Json | null;
          receipt_id?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          amount_usd?: number | null;
          category_id?: string | null;
          created_at?: string | null;
          currency?: string;
          date?: string;
          description?: string | null;
          equivalents?: Json | null;
          exchange_rate?: number | null;
          id?: string;
          is_recurring?: boolean | null;
          rates_at_creation?: Json | null;
          receipt_id?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_receipt_id_fkey";
            columns: ["receipt_id"];
            isOneToOne: false;
            referencedRelation: "receipts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      financial_insights: {
        Row: {
          created_at: string;
          generated_at: string;
          id: string;
          locale: string;
          metrics: Json;
          month: number;
          summary: string | null;
          tips: Json;
          updated_at: string;
          user_id: string;
          valid_until: string;
          year: number;
        };
        Insert: {
          created_at?: string;
          generated_at?: string;
          id?: string;
          locale?: string;
          metrics?: Json;
          month: number;
          summary?: string | null;
          tips?: Json;
          updated_at?: string;
          user_id: string;
          valid_until: string;
          year: number;
        };
        Update: {
          created_at?: string;
          generated_at?: string;
          id?: string;
          locale?: string;
          metrics?: Json;
          month?: number;
          summary?: string | null;
          tips?: Json;
          updated_at?: string;
          user_id?: string;
          valid_until?: string;
          year?: number;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          budget_alerts: boolean | null;
          budget_threshold: number | null;
          push_subscription: Json | null;
          rate_alerts: boolean | null;
          rate_threshold: number | null;
          unusual_spending_alerts: boolean | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          budget_alerts?: boolean | null;
          budget_threshold?: number | null;
          push_subscription?: Json | null;
          rate_alerts?: boolean | null;
          rate_threshold?: number | null;
          unusual_spending_alerts?: boolean | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          budget_alerts?: boolean | null;
          budget_threshold?: number | null;
          push_subscription?: Json | null;
          rate_alerts?: boolean | null;
          rate_threshold?: number | null;
          unusual_spending_alerts?: boolean | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          created_at: string | null;
          data: Json | null;
          id: string;
          is_read: boolean | null;
          message: string;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          data?: Json | null;
          id?: string;
          is_read?: boolean | null;
          message: string;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          data?: Json | null;
          id?: string;
          is_read?: boolean | null;
          message?: string;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      receipts: {
        Row: {
          confidence: number | null;
          created_at: string | null;
          extracted_data: Json | null;
          id: string;
          image_path: string;
          status: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          confidence?: number | null;
          created_at?: string | null;
          extracted_data?: Json | null;
          id?: string;
          image_path: string;
          status?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          confidence?: number | null;
          created_at?: string | null;
          extracted_data?: Json | null;
          id?: string;
          image_path?: string;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "receipts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      recurring_rule_executions: {
        Row: {
          created_at: string | null;
          execution_date: string;
          expense_id: string | null;
          id: string;
          rule_id: string;
        };
        Insert: {
          created_at?: string | null;
          execution_date: string;
          expense_id?: string | null;
          id?: string;
          rule_id: string;
        };
        Update: {
          created_at?: string | null;
          execution_date?: string;
          expense_id?: string | null;
          id?: string;
          rule_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recurring_rule_executions_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurring_rule_executions_rule_id_fkey";
            columns: ["rule_id"];
            isOneToOne: false;
            referencedRelation: "recurring_rules";
            referencedColumns: ["id"];
          },
        ];
      };
      recurring_rules: {
        Row: {
          amount: number;
          category_id: string | null;
          created_at: string | null;
          currency: string;
          description: string | null;
          frequency: string;
          id: string;
          is_active: boolean | null;
          next_due_date: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          amount: number;
          category_id?: string | null;
          created_at?: string | null;
          currency?: string;
          description?: string | null;
          frequency?: string;
          id?: string;
          is_active?: boolean | null;
          next_due_date: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          category_id?: string | null;
          created_at?: string | null;
          currency?: string;
          description?: string | null;
          frequency?: string;
          id?: string;
          is_active?: boolean | null;
          next_due_date?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recurring_rules_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurring_rules_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      trading_insights: {
        Row: {
          analysis_date: string | null;
          best_buy_hour: number | null;
          best_sell_hour: number | null;
          confidence_score: number | null;
          created_at: string | null;
          id: string;
          pair: string;
        };
        Insert: {
          analysis_date?: string | null;
          best_buy_hour?: number | null;
          best_sell_hour?: number | null;
          confidence_score?: number | null;
          created_at?: string | null;
          id?: string;
          pair: string;
        };
        Update: {
          analysis_date?: string | null;
          best_buy_hour?: number | null;
          best_sell_hour?: number | null;
          confidence_score?: number | null;
          created_at?: string | null;
          id?: string;
          pair?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          currency_preference: string | null;
          email: string;
          full_name: string | null;
          id: string;
          theme_preference: string | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          currency_preference?: string | null;
          email: string;
          full_name?: string | null;
          id: string;
          theme_preference?: string | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          currency_preference?: string | null;
          email?: string;
          full_name?: string | null;
          id?: string;
          theme_preference?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      invoke_process_recurring_expenses: { Args: never; Returns: undefined };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
