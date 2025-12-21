import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Building2, Loader2 } from 'lucide-react';

interface CompanyRegistrationProps {
  onSuccess?: () => void;
}

export function CompanyRegistration({ onSuccess }: CompanyRegistrationProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    size: '',
    website: '',
    city: '',
    state: '',
    street: '',
    number: '',
    neighborhood: '',
    zip_code: '',
  });

  const createCompany = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      
      // Criar a empresa
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: data.name,
          description: data.description,
          industry: data.industry,
          size: data.size,
          website: data.website,
          city: data.city,
          state: data.state,
          street: data.street,
          number: data.number,
          neighborhood: data.neighborhood,
          zip_code: data.zip_code,
        })
        .select()
        .single();
      
      if (companyError) throw companyError;
      
      // Adicionar usuário como membro admin da empresa
      const { error: memberError } = await supabase
        .from('company_members')
        .insert({
          company_id: company.id,
          user_id: user.id,
          is_admin: true,
        });
      
      if (memberError) throw memberError;
      
      // Atualizar role do usuário para recruiter
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: 'recruiter' })
        .eq('user_id', user.id);
      
      if (roleError) {
        console.warn('Não foi possível atualizar role:', roleError);
      }
      
      return company;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-membership'] });
      queryClient.invalidateQueries({ queryKey: ['my-company'] });
      toast.success('Empresa cadastrada com sucesso!');
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao cadastrar empresa');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Nome da empresa é obrigatório');
      return;
    }
    createCompany.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-primary" />
        </div>
        <CardTitle className="font-display text-2xl">Cadastrar Empresa</CardTitle>
        <CardDescription>
          Cadastre sua empresa para começar a publicar vagas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Nome da Empresa *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nome da sua empresa"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Descreva sua empresa..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Setor</Label>
              <Select value={formData.industry} onValueChange={(v) => handleChange('industry', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Tecnologia</SelectItem>
                  <SelectItem value="healthcare">Saúde</SelectItem>
                  <SelectItem value="finance">Finanças</SelectItem>
                  <SelectItem value="education">Educação</SelectItem>
                  <SelectItem value="retail">Varejo</SelectItem>
                  <SelectItem value="manufacturing">Indústria</SelectItem>
                  <SelectItem value="services">Serviços</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Tamanho</Label>
              <Select value={formData.size} onValueChange={(v) => handleChange('size', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Número de funcionários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">1-10 funcionários</SelectItem>
                  <SelectItem value="11-50">11-50 funcionários</SelectItem>
                  <SelectItem value="51-200">51-200 funcionários</SelectItem>
                  <SelectItem value="201-500">201-500 funcionários</SelectItem>
                  <SelectItem value="501+">501+ funcionários</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://suaempresa.com.br"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="São Paulo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                placeholder="SP"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Rua</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => handleChange('street', e.target.value)}
                placeholder="Av. Paulista"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => handleChange('number', e.target.value)}
                placeholder="1000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => handleChange('neighborhood', e.target.value)}
                placeholder="Bela Vista"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip_code">CEP</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => handleChange('zip_code', e.target.value)}
                placeholder="01310-100"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={createCompany.isPending}>
            {createCompany.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Cadastrar Empresa
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
