import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Application {
  id: string;
  job_id: string;
  user_id: string;
  status: 'pending' | 'reviewed' | 'interview' | 'rejected' | 'hired';
  cover_letter: string | null;
  created_at: string;
  updated_at: string;
  job?: {
    id: string;
    title: string;
    company: {
      id: string;
      name: string;
      logo_url: string | null;
    };
  };
  profile?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    email: string;
  };
}

export function useMyApplications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-applications'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          job:jobs(
            id,
            title,
            company:companies(id, name, logo_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as Application[];
    },
    enabled: !!user?.id,
  });
}

export function useJobApplications(jobId: string) {
  return useQuery({
    queryKey: ['job-applications', jobId],
    queryFn: async () => {
      // First get applications
      const { data: applications, error } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Then get profiles for each application
      const userIds = applications.map(a => a.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, avatar_url, email')
        .in('user_id', userIds);
      
      // Combine data
      const result = applications.map(app => ({
        ...app,
        profile: profiles?.find(p => p.user_id === app.user_id),
      }));
      
      return result as Application[];
    },
    enabled: !!jobId,
  });
}

export function useApplyToJob() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ jobId, coverLetter }: { jobId: string; coverLetter?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('applications')
        .insert({
          job_id: jobId,
          user_id: user.id,
          cover_letter: coverLetter,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    },
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Application['status'] }) => {
      const { data, error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    },
  });
}
