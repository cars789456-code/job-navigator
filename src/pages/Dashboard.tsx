import { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useJobs, Job } from '@/hooks/useJobs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Briefcase, Search, MapPin, Building2, Clock, MessageSquare, 
  User, LogOut, Menu, X, DollarSign, Star
} from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: profile } = useProfile();
  const { data: jobs, isLoading: jobsLoading } = useJobs({ search: searchQuery || undefined });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const navItems = [
    { to: '/dashboard', icon: Briefcase, label: 'Vagas' },
    { to: '/dashboard/mensagens', icon: MessageSquare, label: 'Mensagens' },
    { to: '/dashboard/perfil', icon: User, label: 'Perfil' },
  ];

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return null;
    const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
    if (min && max) return `${formatter.format(min)} - ${formatter.format(max)}`;
    if (min) return `A partir de ${formatter.format(min)}`;
    if (max) return `Até ${formatter.format(max)}`;
    return null;
  };

  const jobTypeLabels: Record<string, string> = {
    clt: 'CLT',
    pj: 'PJ',
    temporary: 'Temporário',
    internship: 'Estágio',
    remote: 'Remoto',
    hybrid: 'Híbrido',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg gradient-corporate flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold hidden sm:block">JobConnect</span>
          </Link>
          
          {/* Search */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar vagas..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Button
                key={item.to}
                variant={location.pathname === item.to ? 'secondary' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to={item.to}>
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>
          
          {/* User Menu */}
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={() => signOut()} className="hidden md:flex">
              <LogOut className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card p-4">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Button
                  key={item.to}
                  variant={location.pathname === item.to ? 'secondary' : 'ghost'}
                  className="justify-start"
                  asChild
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link to={item.to}>
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                </Button>
              ))}
              <Button variant="ghost" className="justify-start text-destructive" onClick={() => signOut()}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route index element={
            <div>
              <div className="mb-6">
                <h1 className="font-display text-2xl font-bold mb-2">Vagas para você</h1>
                <p className="text-muted-foreground">Encontre a oportunidade perfeita</p>
              </div>
              
              {jobsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : jobs?.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Nenhuma vaga encontrada</h3>
                    <p className="text-muted-foreground">Tente ajustar sua busca</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {jobs?.map((job: Job) => (
                    <Card key={job.id} className="hover:border-primary/30 transition-colors cursor-pointer group">
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
                              {job.is_featured && (
                                <Badge variant="secondary" className="shrink-0">
                                  <Star className="w-3 h-3 mr-1" />
                                  Destaque
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground text-sm mb-3">{job.company?.name}</p>
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
            </div>
          } />
          <Route path="mensagens" element={
            <Card className="text-center py-12">
              <CardContent>
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Mensagens</h3>
                <p className="text-muted-foreground">Sistema de chat em tempo real - Em breve</p>
              </CardContent>
            </Card>
          } />
          <Route path="perfil" element={
            <Card>
              <CardHeader>
                <CardTitle>Meu Perfil</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl">{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-display text-xl font-semibold">{profile?.full_name}</h2>
                    <p className="text-muted-foreground">{profile?.email}</p>
                  </div>
                </div>
                <p className="text-muted-foreground">Edição de perfil completa - Em breve</p>
              </CardContent>
            </Card>
          } />
        </Routes>
      </main>
    </div>
  );
}
