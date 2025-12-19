import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { MessageSquare, Mail, Loader2, User, Clock } from 'lucide-react';
import { useStartConversation, useSendMessage } from '@/hooks/useMessages';

interface Application {
  id: string;
  user_id: string;
  status: 'pending' | 'reviewed' | 'interview' | 'rejected' | 'hired';
  cover_letter: string | null;
  created_at: string;
  profile?: {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    phone: string | null;
    city: string | null;
    state: string | null;
    skills: string[];
    experience: string | null;
    education: string | null;
  };
}

interface CandidatesListProps {
  jobId: string;
  jobTitle: string;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-500/10 text-yellow-600' },
  reviewed: { label: 'Analisado', color: 'bg-blue-500/10 text-blue-600' },
  interview: { label: 'Entrevista', color: 'bg-purple-500/10 text-purple-600' },
  rejected: { label: 'Rejeitado', color: 'bg-red-500/10 text-red-600' },
  hired: { label: 'Contratado', color: 'bg-green-500/10 text-green-600' },
};

export function CandidatesList({ jobId, jobTitle }: CandidatesListProps) {
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessages, setSendingMessages] = useState(false);
  const queryClient = useQueryClient();
  const startConversation = useStartConversation();
  const sendMessage = useSendMessage();

  const { data: applications, isLoading } = useQuery({
    queryKey: ['applications', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Get profiles for each application
      const userIds = data.map(a => a.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);

      return data.map(app => ({
        ...app,
        profile: profiles?.find(p => p.user_id === app.user_id),
      })) as Application[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: string; status: 'pending' | 'reviewed' | 'interview' | 'rejected' | 'hired' }) => {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', jobId] });
      toast.success('Status atualizado!');
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    },
  });

  const handleSelectAll = () => {
    if (selectedCandidates.length === applications?.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(applications?.map(a => a.user_id) || []);
    }
  };

  const handleSelectCandidate = (userId: string) => {
    if (selectedCandidates.includes(userId)) {
      setSelectedCandidates(selectedCandidates.filter(id => id !== userId));
    } else {
      setSelectedCandidates([...selectedCandidates, userId]);
    }
  };

  const handleSendMessages = async () => {
    if (!messageContent.trim() || selectedCandidates.length === 0) return;
    
    setSendingMessages(true);
    try {
      for (const userId of selectedCandidates) {
        const conv = await startConversation.mutateAsync(userId);
        await sendMessage.mutateAsync({ 
          conversationId: conv.id, 
          content: `[${jobTitle}]\n\n${messageContent}` 
        });
      }
      toast.success(`Mensagem enviada para ${selectedCandidates.length} candidato(s)!`);
      setMessageDialogOpen(false);
      setMessageContent('');
      setSelectedCandidates([]);
    } catch (error) {
      toast.error('Erro ao enviar mensagens');
    } finally {
      setSendingMessages(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Checkbox 
            checked={selectedCandidates.length === applications?.length && applications?.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            {selectedCandidates.length} selecionado(s) de {applications?.length || 0}
          </span>
        </div>
        
        {selectedCandidates.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setMessageDialogOpen(true)}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Enviar Mensagem
            </Button>
          </div>
        )}
      </div>

      {applications?.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">Nenhum candidato ainda</h3>
            <p className="text-muted-foreground">Os candidatos aparecerão aqui quando se inscreverem</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {applications?.map((app) => (
            <Card key={app.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Checkbox 
                    checked={selectedCandidates.includes(app.user_id)}
                    onCheckedChange={() => handleSelectCandidate(app.user_id)}
                  />
                  
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={app.profile?.avatar_url || undefined} />
                    <AvatarFallback>{app.profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold">{app.profile?.full_name || 'Usuário'}</h4>
                        <p className="text-sm text-muted-foreground">{app.profile?.email}</p>
                        {app.profile?.city && (
                          <p className="text-sm text-muted-foreground">
                            {app.profile.city}, {app.profile.state}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Select 
                          value={app.status} 
                          onValueChange={(v: 'pending' | 'reviewed' | 'interview' | 'rejected' | 'hired') => updateStatus.mutate({ applicationId: app.id, status: v })}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusLabels).map(([value, { label }]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {app.profile?.skills && app.profile.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {app.profile.skills.slice(0, 5).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {app.profile.skills.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{app.profile.skills.length - 5}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {app.cover_letter && (
                      <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
                        {app.cover_letter}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(app.created_at).toLocaleDateString('pt-BR')}
                      </span>
                      <Badge className={statusLabels[app.status].color}>
                        {statusLabels[app.status].label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Mensagem para Candidatos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A mensagem será enviada para {selectedCandidates.length} candidato(s) selecionado(s).
            </p>
            <Textarea
              placeholder="Digite sua mensagem..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendMessages} disabled={sendingMessages || !messageContent.trim()}>
              {sendingMessages && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enviar Mensagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
