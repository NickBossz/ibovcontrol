import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { PostgrestError } from '@supabase/supabase-js'
import type { User, UserInsert, UserUpdate } from '@/types/supabase'

// Hook para buscar dados
export const useSupabaseQuery = <T>(
  key: string[],
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  options?: {
    enabled?: boolean
    refetchOnWindowFocus?: boolean
  }
) => {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await queryFn()
      if (error) throw error
      return data
    },
    enabled: options?.enabled ?? true,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
  })
}

// Hook para mutações (insert, update, delete)
export const useSupabaseMutation = <T, V>(
  mutationFn: (variables: V) => Promise<{ data: T | null; error: PostgrestError | null }>,
  options?: {
    onSuccess?: (data: T) => void
    onError?: (error: PostgrestError) => void
    invalidateQueries?: string[][]
  }
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: V) => {
      const { data, error } = await mutationFn(variables)
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      options?.onSuccess?.(data)
      // Invalidar queries relacionadas
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey })
        })
      }
    },
    onError: (error: PostgrestError) => {
      options?.onError?.(error)
    },
  })
}

// Exemplo de uso para perfis de usuário
export const useProfiles = () => {
  return useSupabaseQuery<User[]>(
    ['profiles'],
    async () => {
      const { data, error } = await supabase.from('profiles').select('*')
      return { data, error }
    }
  )
}

export const useProfile = (id: string) => {
  return useSupabaseQuery<User>(
    ['profiles', id],
    async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
      return { data, error }
    },
    { enabled: !!id }
  )
}

export const useCreateProfile = () => {
  return useSupabaseMutation<User, UserInsert>(
    async (profile) => {
      const { data, error } = await supabase.from('profiles').insert(profile).select().single()
      return { data, error }
    },
    {
      invalidateQueries: [['profiles']]
    }
  )
}

export const useUpdateProfile = () => {
  return useSupabaseMutation<User, { id: string; updates: Partial<UserUpdate> }>(
    async ({ id, updates }) => {
      const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single()
      return { data, error }
    },
    {
      invalidateQueries: [['profiles']]
    }
  )
}

export const useDeleteProfile = () => {
  return useSupabaseMutation<void, string>(
    async (id) => {
      const { error } = await supabase.from('profiles').delete().eq('id', id)
      return { data: undefined, error }
    },
    {
      invalidateQueries: [['profiles']]
    }
  )
} 