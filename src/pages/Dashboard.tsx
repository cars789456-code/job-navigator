import { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Briefcase, MessageSquare, User, LogOut, Menu, X, Building2, BarChart3, Shield, PlusCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { JobSearch } from '@/components/jobs/JobSearch';
import { JobsManagement } from '@/components/jobs/JobsManagement';
import { MessagesPanel } from '@/components/messages/MessagesPanel';
import { ProfileEdit } from '@/components/profile/ProfileEdit';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { CompanyRegistration } from '@/components/company/CompanyRegistration';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  
  const { data: profile } = useProfile();

  // Check user role for admin access
  const { data: userRole } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) return null;
      return data?.role;
    },
    enabled: !!user?.id,
  });

  // Check if user has a company
  const { data: hasCompany } = useQuery({
    queryKey: ['has-company', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .from('company_members')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') return false;
      return !!data;
    },
    enabled: !!user?.id,
  });

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

  const isAdmin = userRole === 'root' || userRole === 'company_admin';

  const navItems = [
    { to: '/dashboard', icon: Briefcase, label: 'Vagas' },
    { to: '/dashboard/gerenciar', icon: Building2, label: 'Gerenciar' },
    { to: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/dashboard/mensagens', icon: MessageSquare, label: 'Mensagens' },
    { to: '/dashboard/perfil', icon: User, label: 'Perfil' },
  ];

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
            {isAdmin && (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin">
                  <Shield className="w-4 h-4 mr-2" />
                  Admin
                </Link>
              </Button>
            )}
          </nav>
          
          {/* User Menu */}
          <div className="flex items-center gap-2">
            {!hasCompany && (
              <Button variant="outline" size="sm" onClick={() => setShowCompanyModal(true)} className="hidden md:flex">
                <PlusCircle className="w-4 h-4 mr-2" />
                Cadastrar Empresa
              </Button>
            )}
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
              {isAdmin && (
                <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                  <Link to="/admin">
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </Link>
                </Button>
              )}
              {!hasCompany && (
                <Button variant="outline" className="justify-start" onClick={() => { setMobileMenuOpen(false); setShowCompanyModal(true); }}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Cadastrar Empresa
                </Button>
              )}
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
          <Route index element={<JobSearch />} />
          <Route path="gerenciar" element={<JobsManagement />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="mensagens" element={<MessagesPanel />} />
          <Route path="perfil" element={<ProfileEdit />} />
        </Routes>
      </main>

      {/* Company Registration Modal */}
      <Dialog open={showCompanyModal} onOpenChange={setShowCompanyModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Empresa</DialogTitle>
          </DialogHeader>
          <CompanyRegistration onSuccess={() => setShowCompanyModal(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
