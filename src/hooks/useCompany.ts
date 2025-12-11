import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Company {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  industry: string | null;
  size: string | null;
  subscription_tier: 'free' | 'premium';
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  created_at: string;
  updated_at: string;
}

export function useMyCompany() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-company'],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data: membership, error: memberError } = await supabase
        .from('company_members')
        .select('company_id, is_admin')
        .eq('user_id', user.id)
        .single();
      
      if (memberError || !membership) return null;
      
      const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', membership.company_id)
        .single();
      
      if (error) throw error;
      
      return { ...company, is_admin: membership.is_admin } as Company & { is_admin: boolean };
    },
    enabled: !!user?.id,
  });
}

export function useCompany(companyId: string) {
  return useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();
      
      if (error) throw error;
      return data as Company;
    },
    enabled: !!companyId,
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (company: Omit<Company, 'id' | 'created_at' | 'updated_at' | 'subscription_tier'>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert(company)
        .select()
        .single();
      
      if (companyError) throw companyError;
      
      // Add user as admin member
      const { error: memberError } = await supabase
        .from('company_members')
        .insert({
          company_id: newCompany.id,
          user_id: user.id,
          is_admin: true,
        });
      
      if (memberError) throw memberError;
      
      // Update user role to recruiter
      await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          role: 'recruiter',
        });
      
      return newCompany;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-company'] });
    },
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Company> & { id: string }) => {
      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-company'] });
      queryClient.invalidateQueries({ queryKey: ['company', variables.id] });
    },
  });
}

export function useCompanyJobs(companyId: string) {
  return useQuery({
    queryKey: ['company-jobs', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
  });
}
