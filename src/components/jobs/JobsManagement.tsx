import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Users, MapPin, Clock, Loader2, Search, Building2, X } from 'lucide-react';
import { JobForm } from './JobForm';
import { CandidatesList } from './CandidatesList';
import { useTags } from '@/hooks/useTags';
import { Job } from '@/hooks/useJobs';

const jobTypeLabels: Record<string, string> = {
  clt: 'CLT',
  pj: 'PJ',
  temporary: 'Temporário',
  internship: 'Estágio',
  remote: 'Remoto',
  hybrid: 'Híbrido',
};

export function JobsManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [viewingCandidates, setViewingCandidates] = useState<Job | null>(null);
  const { data: tags } = useTags();

  // Get user's company (optional)
  const { data: companyMembership } = useQuery({
    queryKey: ['company-membership', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('company_members')
        .select('company_id, is_admin, company:companies(*)')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Get jobs (user's own or company's)
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['my-jobs', user?.id, companyMembership?.company_id, searchQuery, selectedTags],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('jobs')
        .select(`
          *,
          company:companies(id, name, logo_url, subscription_tier)
        `)
        .order('created_at', { ascending: false });

      // Filter by company or user (or both)
      if (companyMembership?.company_id) {
        query = query.or(`company_id.eq.${companyMembership.company_id},created_by.eq.${user.id}`);
      } else {
        query = query.eq('created_by', user.id);
      }

      // Search filter
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Filter by tags client-side
      let filteredJobs = data as Job[];
      if (selectedTags.length > 0) {
        filteredJobs = filteredJobs.filter(job => 
          job.skills_required?.some(skill => 
            selectedTags.some(tag => skill.toLowerCase().includes(tag.toLowerCase()))
          )
        );
      }
      
      return filteredJobs;
    },
    enabled: !!user?.id,
  });

  // Get application counts
  const { data: applicationCounts } = useQuery({
    queryKey: ['application-counts', jobs?.map(j => j.id)],
    queryFn: async () => {
      if (!jobs || jobs.length === 0) return {};
      
      const { data, error } = await supabase
        .from('applications')
        .select('job_id')
        .in('job_id', jobs.map(j => j.id));
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(app => {
        counts[app.job_id] = (counts[app.job_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!jobs && jobs.length > 0,
  });

  const createJob = useMutation({
    mutationFn: async (jobData: any) => {
      if (!companyMembership?.company_id) {
        throw new Error('Você precisa estar vinculado a uma empresa para criar vagas');
      }
      
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          ...jobData,
          company_id: companyMembership.company_id,
          created_by: user?.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
      toast.success('Vaga criada com sucesso!');
      setIsFormOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar vaga');
    },
  });

  const updateJob = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Job>) => {
      const { data, error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
      toast.success('Vaga atualizada com sucesso!');
      setIsFormOpen(false);
      setEditingJob(null);
    },
    onError: () => {
      toast.error('Erro ao atualizar vaga');
    },
  });

  const deleteJob = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] });
      toast.success('Vaga excluída com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir vaga');
    },
  });

  const handleSubmit = (data: any) => {
    if (editingJob) {
      updateJob.mutate({ id: editingJob.id, ...data });
    } else {
      createJob.mutate(data);
    }
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setIsFormOpen(true);
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleAddTagFilter = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  // Usuário precisa estar vinculado a uma empresa para criar vagas
  const canCreateJobs = !!companyMembership?.company_id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Minhas Vagas</h1>
          <p className="text-muted-foreground">
            {canCreateJobs ? 'Gerencie as vagas da sua empresa' : 'Cadastre uma empresa para criar vagas'}
          </p>
        </div>
        {canCreateJobs && (
          <Button onClick={() => { setEditingJob(null); setIsFormOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Vaga
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou descrição..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Tag filters */}
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button onClick={() => handleRemoveTag(tag)}>
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          {tags && tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {tags.filter(t => !selectedTags.includes(t.name)).slice(0, 8).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => handleAddTagFilter(tag.name)}
                >
                  + {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : jobs?.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Plus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Nenhuma vaga encontrada</h3>
            <p className="text-muted-foreground">Crie sua primeira vaga para começar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {jobs?.map((job) => (
            <Card key={job.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg truncate">{job.title}</h3>
                      {!job.is_active && (
                        <Badge variant="secondary">Inativa</Badge>
                      )}
                      {job.is_featured && (
                        <Badge variant="default">Destaque</Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.city}, {job.state}
                      </span>
                      <Badge variant="outline">{jobTypeLabels[job.job_type]}</Badge>
                      {job.is_remote && <Badge variant="secondary">Remoto</Badge>}
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(job.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    {job.skills_required && job.skills_required.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {job.skills_required.slice(0, 5).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {job.skills_required.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{job.skills_required.length - 5}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setViewingCandidates(job)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {applicationCounts?.[job.id] || 0} Candidatos
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(job)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir vaga?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. A vaga "{job.title}" será excluída permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteJob.mutate(job.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Job Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingJob ? 'Editar Vaga' : 'Nova Vaga'}</DialogTitle>
          </DialogHeader>
          <JobForm
            job={editingJob}
            companyId={companyMembership?.company_id}
            onSubmit={handleSubmit}
            onCancel={() => { setIsFormOpen(false); setEditingJob(null); }}
            isLoading={createJob.isPending || updateJob.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Candidates Dialog */}
      <Dialog open={!!viewingCandidates} onOpenChange={() => setViewingCandidates(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidatos - {viewingCandidates?.title}</DialogTitle>
          </DialogHeader>
          {viewingCandidates && (
            <CandidatesList jobId={viewingCandidates.id} jobTitle={viewingCandidates.title} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
