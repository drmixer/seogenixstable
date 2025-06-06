export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      audits: {
        Row: {
          id: string
          site_id: string
          ai_visibility_score: number
          schema_score: number
          semantic_score: number
          citation_score: number
          technical_seo_score: number
          created_at: string
        }
        Insert: {
          id?: string
          site_id: string
          ai_visibility_score: number
          schema_score: number
          semantic_score: number
          citation_score: number
          technical_seo_score: number
          created_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          ai_visibility_score?: number
          schema_score?: number
          semantic_score?: number
          citation_score?: number
          technical_seo_score?: number
          created_at?: string
        }
      }
      citations: {
        Row: {
          id: string
          site_id: string
          source_type: string
          snippet_text: string
          url: string
          detected_at: string
        }
        Insert: {
          id?: string
          site_id: string
          source_type: string
          snippet_text: string
          url: string
          detected_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          source_type?: string
          snippet_text?: string
          url?: string
          detected_at?: string
        }
      }
      entities: {
        Row: {
          id: string
          site_id: string
          entity_name: string
          entity_type: string
          mention_count: number
          gap: boolean
          created_at: string
        }
        Insert: {
          id?: string
          site_id: string
          entity_name: string
          entity_type: string
          mention_count: number
          gap: boolean
          created_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          entity_name?: string
          entity_type?: string
          mention_count?: number
          gap?: boolean
          created_at?: string
        }
      }
      schemas: {
        Row: {
          id: string
          audit_id: string
          schema_type: string
          markup: string
          created_at: string
        }
        Insert: {
          id?: string
          audit_id: string
          schema_type: string
          markup: string
          created_at?: string
        }
        Update: {
          id?: string
          audit_id?: string
          schema_type?: string
          markup?: string
          created_at?: string
        }
      }
      sites: {
        Row: {
          id: string
          user_id: string
          url: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          url: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          url?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      summaries: {
        Row: {
          id: string
          site_id: string
          summary_type: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          site_id: string
          summary_type: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          site_id?: string
          summary_type?: string
          content?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}