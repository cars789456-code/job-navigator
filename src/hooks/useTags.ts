import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Tag {
  id: string;
  name: string;
  description: string | null;
  type: 'global' | 'local';
  approved: boolean;
  user_id: string | null;
  company_id: string | null;
  created_at: string;
}

export function useTags(includeLocal = true) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tags', includeLocal, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Tag[];
    },
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (tag: { name: string; description?: string; type?: 'global' | 'local' }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('tags')
        .insert({
          name: tag.name,
          description: tag.description || null,
          type: tag.type || 'local',
          user_id: user.id,
          approved: tag.type === 'local' ? true : false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}
