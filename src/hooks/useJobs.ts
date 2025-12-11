import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type JobType = Database['public']['Enums']['job_type'];

export interface Job {
  id: string;
  company_id: string;
  created_by: string | null;
  title: string;
  description: string;
  responsibilities: string | null;
  requirements: string | null;
  education_required: string | null;
  experience_required: string | null;
  skills_required: string[] | null;
  benefits: string | null;
  salary_min: number | null;
  salary_max: number | null;
  job_type: JobType;
  work_schedule: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  zip_code: string | null;
  is_remote: boolean | null;
  is_featured: boolean | null;
  is_active: boolean | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  company?: {
    id: string;
    name: string;
    logo_url: string | null;
    subscription_tier: string;
  };
}

export interface JobFilters {
  search?: string;
  city?: string;
  state?: string;
  job_type?: JobType;
  tags?: string[];
  is_remote?: boolean;
}

export function useJobs(filters?: JobFilters) {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select(`
          *,
          company:companies(id, name, logo_url, subscription_tier)
        `)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }

      if (filters?.state) {
        query = query.eq('state', filters.state);
      }

      if (filters?.job_type) {
        query = query.eq('job_type', filters.job_type);
      }

      if (filters?.is_remote !== undefined) {
        query = query.eq('is_remote', filters.is_remote);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as unknown as Job[];
    },
  });
}

export function useJob(jobId: string) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          company:companies(id, name, logo_url, description, subscription_tier)
        `)
        .eq('id', jobId)
        .single();
      
      if (error) throw error;
      return data as unknown as Job;
    },
    enabled: !!jobId,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (job: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'company'>) => {
      const { data, error } = await supabase
        .from('jobs')
        .insert({ ...job, created_by: user?.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useUpdateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Job> & { id: string }) => {
      const { data, error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job', variables.id] });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}
