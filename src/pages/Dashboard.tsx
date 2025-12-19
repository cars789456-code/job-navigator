import { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Briefcase, MessageSquare, User, LogOut, Menu, X, Building2, BarChart3 } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { JobSearch } from '@/components/jobs/JobSearch';
import { JobsManagement } from '@/components/jobs/JobsManagement';
import { MessagesPanel } from '@/components/messages/MessagesPanel';
import { ProfileEdit } from '@/components/profile/ProfileEdit';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { data: profile } = useProfile();

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
          <Route index element={<JobSearch />} />
          <Route path="gerenciar" element={<JobsManagement />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="mensagens" element={<MessagesPanel />} />
          <Route path="perfil" element={<ProfileEdit />} />
        </Routes>
      </main>
    </div>
  );
}
