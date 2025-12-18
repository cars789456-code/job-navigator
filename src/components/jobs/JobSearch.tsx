import { useState, useEffect } from 'react';
import { useJobs, Job, JobFilters } from '@/hooks/useJobs';
import { useTags } from '@/hooks/useTags';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Search, MapPin, Building2, Clock, DollarSign, Star, 
  X, Briefcase, Loader2, Send
} from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

const jobTypeLabels: Record<string, string> = {
  clt: 'CLT',
  pj: 'PJ',
  temporary: 'Temporário',
  internship: 'Estágio',
  remote: 'Remoto',
  hybrid: 'Híbrido',
};

export function JobSearch() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  
  const { data: tags } = useTags();
  
  // Build filters
  const filters: JobFilters = {
    search: searchQuery || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
  };
  
  const { data: jobs, isLoading } = useJobs(filters);

  // Check user's applications
  const { data: myApplications } = useQuery({
    queryKey: ['my-applications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('applications')
        .select('job_id')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data.map(a => a.job_id);
    },
    enabled: !!user?.id,
  });

  // Filter jobs by tags on client side
  const filteredJobs = jobs?.filter(job => {
    if (selectedTags.length === 0) return true;
    return job.skills_required?.some(skill => 
      selectedTags.some(tag => skill.toLowerCase().includes(tag.toLowerCase()))
    );
  });

  const applyToJob = useMutation({
    mutationFn: async ({ jobId, coverLetter }: { jobId: string; coverLetter: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('applications')
        .insert({
          job_id: jobId,
          user_id: user.id,
          cover_letter: coverLetter || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      toast.success('Candidatura enviada com sucesso!');
      setApplyDialogOpen(false);
      setCoverLetter('');
      setSelectedJob(null);
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('Você já se candidatou a esta vaga');
      } else {
        toast.error('Erro ao enviar candidatura');
      }
    },
  });

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleAddTag = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleApply = (job: Job) => {
    setSelectedJob(job);
    setApplyDialogOpen(true);
  };

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return null;
    const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
    if (min && max) return `${formatter.format(min)} - ${formatter.format(max)}`;
    if (min) return `A partir de ${formatter.format(min)}`;
    if (max) return `Até ${formatter.format(max)}`;
    return null;
  };

  const hasApplied = (jobId: string) => myApplications?.includes(jobId);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold mb-2">Vagas para você</h1>
        <p className="text-muted-foreground">Encontre a oportunidade perfeita</p>
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
        
        {/* Active Filters */}
        {(searchQuery || selectedTags.length > 0) && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">Filtros ativos:</span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Busca: {searchQuery}
                <button onClick={() => setSearchQuery('')}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button onClick={() => handleRemoveTag(tag)}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {(searchQuery || selectedTags.length > 0) && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => { setSearchQuery(''); setSelectedTags([]); }}
              >
                Limpar todos
              </Button>
            )}
          </div>
        )}
        
        {/* Available Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.filter(t => !selectedTags.includes(t.name)).slice(0, 12).map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => handleAddTag(tag.name)}
              >
                + {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredJobs?.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Nenhuma vaga encontrada</h3>
            <p className="text-muted-foreground">Tente ajustar seus filtros de busca</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredJobs?.map((job) => (
            <Card 
              key={job.id} 
              className="hover:border-primary/30 transition-colors cursor-pointer group"
              onClick={() => setSelectedJob(job)}
            >
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    {job.company?.logo_url ? (
                      <img src={job.company.logo_url} alt="" className="w-8 h-8 rounded" />
                    ) : (
                      <Building2 className="w-6 h-6 text-accent-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-2 shrink-0">
                        {job.is_featured && (
                          <Badge variant="secondary">
                            <Star className="w-3 h-3 mr-1" />
                            Destaque
                          </Badge>
                        )}
                        {hasApplied(job.id) && (
                          <Badge variant="outline" className="text-green-600">
                            Candidatado
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3">{job.company?.name}</p>
                    
                    {job.skills_required && job.skills_required.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {job.skills_required.slice(0, 4).map((skill) => (
                          <Badge 
                            key={skill} 
                            variant="secondary" 
                            className="text-xs cursor-pointer hover:bg-primary/20"
                            onClick={(e) => { e.stopPropagation(); handleAddTag(skill); }}
                          >
                            {skill}
                          </Badge>
                        ))}
                        {job.skills_required.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{job.skills_required.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.city}, {job.state}
                      </span>
                      <Badge variant="outline">{jobTypeLabels[job.job_type] || job.job_type}</Badge>
                      {job.is_remote && <Badge variant="secondary">Remoto</Badge>}
                      {formatSalary(job.salary_min, job.salary_max) && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {formatSalary(job.salary_min, job.salary_max)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(job.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Job Details Dialog */}
      <Dialog open={!!selectedJob && !applyDialogOpen} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-accent flex items-center justify-center">
                    {selectedJob.company?.logo_url ? (
                      <img src={selectedJob.company.logo_url} alt="" className="w-12 h-12 rounded" />
                    ) : (
                      <Building2 className="w-8 h-8 text-accent-foreground" />
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedJob.title}</DialogTitle>
                    <p className="text-muted-foreground">{selectedJob.company?.name}</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{jobTypeLabels[selectedJob.job_type]}</Badge>
                  {selectedJob.is_remote && <Badge variant="secondary">Remoto</Badge>}
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {selectedJob.city}, {selectedJob.state}
                  </span>
                </div>

                {formatSalary(selectedJob.salary_min, selectedJob.salary_max) && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">{formatSalary(selectedJob.salary_min, selectedJob.salary_max)}</span>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2">Descrição</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedJob.description}</p>
                </div>

                {selectedJob.responsibilities && (
                  <div>
                    <h4 className="font-semibold mb-2">Responsabilidades</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedJob.responsibilities}</p>
                  </div>
                )}

                {selectedJob.requirements && (
                  <div>
                    <h4 className="font-semibold mb-2">Requisitos</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedJob.requirements}</p>
                  </div>
                )}

                {selectedJob.skills_required && selectedJob.skills_required.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Habilidades</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedJob.skills_required.map((skill) => (
                        <Badge key={skill} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedJob.benefits && (
                  <div>
                    <h4 className="font-semibold mb-2">Benefícios</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedJob.benefits}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                {hasApplied(selectedJob.id) ? (
                  <Badge variant="outline" className="text-green-600 text-base py-2 px-4">
                    Você já se candidatou a esta vaga
                  </Badge>
                ) : (
                  <Button onClick={() => handleApply(selectedJob)}>
                    <Send className="w-4 h-4 mr-2" />
                    Candidatar-se
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Apply Dialog */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Candidatar-se a {selectedJob?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cover_letter">Carta de Apresentação (opcional)</Label>
              <Textarea
                id="cover_letter"
                placeholder="Escreva uma breve apresentação sobre você e por que você é ideal para esta vaga..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => selectedJob && applyToJob.mutate({ jobId: selectedJob.id, coverLetter })}
              disabled={applyToJob.isPending}
            >
              {applyToJob.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enviar Candidatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
