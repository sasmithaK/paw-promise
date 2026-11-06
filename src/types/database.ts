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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          new_values: Json | null
          old_values: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dog_events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          details: Json
          dog_id: string
          event_type: Database["public"]["Enums"]["dog_event_type"]
          id: string
          location: unknown
          location_label: string | null
          occurred_at: string
          title: string
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          visibility: Database["public"]["Enums"]["record_visibility"]
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          details?: Json
          dog_id: string
          event_type: Database["public"]["Enums"]["dog_event_type"]
          id?: string
          location?: unknown
          location_label?: string | null
          occurred_at: string
          title: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          visibility?: Database["public"]["Enums"]["record_visibility"]
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          details?: Json
          dog_id?: string
          event_type?: Database["public"]["Enums"]["dog_event_type"]
          id?: string
          location?: unknown
          location_label?: string | null
          occurred_at?: string
          title?: string
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          visibility?: Database["public"]["Enums"]["record_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "dog_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dog_events_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dog_events_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "published_dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      dog_photos: {
        Row: {
          caption: string | null
          created_at: string
          dog_id: string
          id: string
          is_primary: boolean
          storage_path: string
          uploaded_by: string
          visibility: Database["public"]["Enums"]["record_visibility"]
        }
        Insert: {
          caption?: string | null
          created_at?: string
          dog_id: string
          id?: string
          is_primary?: boolean
          storage_path: string
          uploaded_by: string
          visibility?: Database["public"]["Enums"]["record_visibility"]
        }
        Update: {
          caption?: string | null
          created_at?: string
          dog_id?: string
          id?: string
          is_primary?: boolean
          storage_path?: string
          uploaded_by?: string
          visibility?: Database["public"]["Enums"]["record_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "dog_photos_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dog_photos_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "published_dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dog_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dogs: {
        Row: {
          breed: string | null
          colour: string | null
          created_at: string
          created_by: string
          distinguishing_features: string | null
          dog_code: number
          estimated_age: string | null
          found_at: string
          found_location: unknown
          found_location_label: string
          id: string
          location_accuracy_m: number | null
          name: string | null
          public_location: unknown
          record_status: Database["public"]["Enums"]["dog_record_status"]
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sex: Database["public"]["Enums"]["dog_sex"]
          size: string | null
          sterilisation_status: string
          updated_at: string
          vaccination_status: string
        }
        Insert: {
          breed?: string | null
          colour?: string | null
          created_at?: string
          created_by: string
          distinguishing_features?: string | null
          dog_code?: number
          estimated_age?: string | null
          found_at: string
          found_location?: unknown
          found_location_label: string
          id?: string
          location_accuracy_m?: number | null
          name?: string | null
          public_location?: unknown
          record_status?: Database["public"]["Enums"]["dog_record_status"]
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sex?: Database["public"]["Enums"]["dog_sex"]
          size?: string | null
          sterilisation_status?: string
          updated_at?: string
          vaccination_status?: string
        }
        Update: {
          breed?: string | null
          colour?: string | null
          created_at?: string
          created_by?: string
          distinguishing_features?: string | null
          dog_code?: number
          estimated_age?: string | null
          found_at?: string
          found_location?: unknown
          found_location_label?: string
          id?: string
          location_accuracy_m?: number | null
          name?: string | null
          public_location?: unknown
          record_status?: Database["public"]["Enums"]["dog_record_status"]
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sex?: Database["public"]["Enums"]["dog_sex"]
          size?: string | null
          sterilisation_status?: string
          updated_at?: string
          vaccination_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "dogs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dogs_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attachments: {
        Row: {
          attachment_type: string | null
          created_at: string
          event_id: string
          id: string
          storage_path: string
          uploaded_by: string
          visibility: Database["public"]["Enums"]["record_visibility"]
        }
        Insert: {
          attachment_type?: string | null
          created_at?: string
          event_id: string
          id?: string
          storage_path: string
          uploaded_by: string
          visibility?: Database["public"]["Enums"]["record_visibility"]
        }
        Update: {
          attachment_type?: string | null
          created_at?: string
          event_id?: string
          id?: string
          storage_path?: string
          uploaded_by?: string
          visibility?: Database["public"]["Enums"]["record_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "event_attachments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "dog_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attachments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "published_dog_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participants: {
        Row: {
          context: string | null
          created_at: string
          event_id: string
          id: string
          participant_name: string | null
          user_id: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string
          event_id: string
          id?: string
          participant_name?: string | null
          user_id?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string
          event_id?: string
          id?: string
          participant_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "dog_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "published_dog_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          dog_id: string
          due_at: string | null
          id: string
          related_event_id: string | null
          status: Database["public"]["Enums"]["follow_up_status"]
          title: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          dog_id: string
          due_at?: string | null
          id?: string
          related_event_id?: string | null
          status?: Database["public"]["Enums"]["follow_up_status"]
          title: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          dog_id?: string
          due_at?: string | null
          id?: string
          related_event_id?: string | null
          status?: Database["public"]["Enums"]["follow_up_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "published_dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "dog_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "published_dog_events"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          administered_at: string | null
          assessment: string | null
          created_at: string
          created_by: string
          dog_id: string
          event_id: string | null
          id: string
          medication: string | null
          next_due_at: string | null
          provider_name: string | null
          provider_type: string | null
          treatment: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          administered_at?: string | null
          assessment?: string | null
          created_at?: string
          created_by: string
          dog_id: string
          event_id?: string | null
          id?: string
          medication?: string | null
          next_due_at?: string | null
          provider_name?: string | null
          provider_type?: string | null
          treatment?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          administered_at?: string | null
          assessment?: string | null
          created_at?: string
          created_by?: string
          dog_id?: string
          event_id?: string | null
          id?: string
          medication?: string | null
          next_due_at?: string | null
          provider_name?: string | null
          provider_type?: string | null
          treatment?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "published_dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "dog_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "published_dog_events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: Database["public"]["Enums"]["account_status"]
          avatar_path: string | null
          created_at: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          account_status?: Database["public"]["Enums"]["account_status"]
          avatar_path?: string | null
          created_at?: string
          full_name: string
          id: string
          updated_at?: string
        }
        Update: {
          account_status?: Database["public"]["Enums"]["account_status"]
          avatar_path?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          dog_id: string | null
          event_id: string | null
          id: string
          reason: string
          reporter_id: string
          resolution_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          dog_id?: string | null
          event_id?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolution_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          created_at?: string
          description?: string | null
          dog_id?: string | null
          event_id?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolution_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "published_dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "dog_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "published_dog_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      published_dog_events: {
        Row: {
          created_at: string | null
          description: string | null
          dog_id: string | null
          event_type: Database["public"]["Enums"]["dog_event_type"] | null
          id: string | null
          location_label: string | null
          occurred_at: string | null
          title: string | null
          updated_at: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "dog_events_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "dogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dog_events_dog_id_fkey"
            columns: ["dog_id"]
            isOneToOne: false
            referencedRelation: "published_dogs"
            referencedColumns: ["id"]
          },
        ]
      }
      published_dogs: {
        Row: {
          breed: string | null
          colour: string | null
          created_at: string | null
          distinguishing_features: string | null
          estimated_age: string | null
          found_at: string | null
          found_location_label: string | null
          id: string | null
          name: string | null
          paw_code: string | null
          public_location: unknown
          sex: Database["public"]["Enums"]["dog_sex"] | null
          size: string | null
          sterilisation_status: string | null
          updated_at: string | null
          vaccination_status: string | null
        }
        Insert: {
          breed?: string | null
          colour?: string | null
          created_at?: string | null
          distinguishing_features?: string | null
          estimated_age?: string | null
          found_at?: string | null
          found_location_label?: string | null
          id?: string | null
          name?: string | null
          paw_code?: never
          public_location?: unknown
          sex?: Database["public"]["Enums"]["dog_sex"] | null
          size?: string | null
          sterilisation_status?: string | null
          updated_at?: string | null
          vaccination_status?: string | null
        }
        Update: {
          breed?: string | null
          colour?: string | null
          created_at?: string | null
          distinguishing_features?: string | null
          estimated_age?: string | null
          found_at?: string | null
          found_location_label?: string | null
          id?: string | null
          name?: string | null
          paw_code?: never
          public_location?: unknown
          sex?: Database["public"]["Enums"]["dog_sex"] | null
          size?: string | null
          sterilisation_status?: string | null
          updated_at?: string | null
          vaccination_status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      account_status: "ACTIVE" | "SUSPENDED" | "DISABLED"
      app_role: "MEMBER" | "MODERATOR" | "SUPER_ADMIN"
      dog_event_type:
        | "DISCOVERY"
        | "SIGHTING"
        | "FEEDING"
        | "HEALTH_OBSERVATION"
        | "VETERINARY_VISIT"
        | "VACCINATION"
        | "STERILISATION"
        | "RESCUE"
        | "STATUS_CHANGE"
        | "GENERAL_UPDATE"
      dog_record_status: "PENDING" | "PUBLISHED" | "REJECTED" | "ARCHIVED"
      dog_sex: "MALE" | "FEMALE" | "UNKNOWN"
      follow_up_status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
      record_visibility: "PUBLIC" | "MEMBERS" | "PRIVATE"
      report_status: "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED"
      verification_status:
        | "UNVERIFIED"
        | "EVIDENCE_ATTACHED"
        | "VERIFIED"
        | "DISPUTED"
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
    Enums: {
      account_status: ["ACTIVE", "SUSPENDED", "DISABLED"],
      app_role: ["MEMBER", "MODERATOR", "SUPER_ADMIN"],
      dog_event_type: [
        "DISCOVERY",
        "SIGHTING",
        "FEEDING",
        "HEALTH_OBSERVATION",
        "VETERINARY_VISIT",
        "VACCINATION",
        "STERILISATION",
        "RESCUE",
        "STATUS_CHANGE",
        "GENERAL_UPDATE",
      ],
      dog_record_status: ["PENDING", "PUBLISHED", "REJECTED", "ARCHIVED"],
      dog_sex: ["MALE", "FEMALE", "UNKNOWN"],
      follow_up_status: ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      record_visibility: ["PUBLIC", "MEMBERS", "PRIVATE"],
      report_status: ["OPEN", "UNDER_REVIEW", "RESOLVED", "DISMISSED"],
      verification_status: [
        "UNVERIFIED",
        "EVIDENCE_ATTACHED",
        "VERIFIED",
        "DISPUTED",
      ],
    },
  },
} as const

