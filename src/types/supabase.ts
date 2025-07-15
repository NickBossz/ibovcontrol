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
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      carteira: {
        Row: {
          id: string
          user_id: string
          ativo_codigo: string
          quantidade: number
          preco_medio: number
          data_compra: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ativo_codigo: string
          quantidade: number
          preco_medio: number
          data_compra: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ativo_codigo?: string
          quantidade?: number
          preco_medio?: number
          data_compra?: string
          created_at?: string
          updated_at?: string
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
  }
}

// Tipos úteis para autenticação
export type User = Database['public']['Tables']['profiles']['Row']
export type UserInsert = Database['public']['Tables']['profiles']['Insert']
export type UserUpdate = Database['public']['Tables']['profiles']['Update'] 