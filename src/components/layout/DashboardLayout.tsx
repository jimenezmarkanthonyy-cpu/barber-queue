import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  Scissors,
  Calendar,
  ClipboardList,
  Users,
  LayoutDashboard,
  BarChart3,
  Building2,
  LogOut,
  Menu,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const customerNavItems: NavItem[] = [
  { title: 'Book Appointment', href: '/dashboard', icon: <Calendar className="h-5 w-5" /> },
  { title: 'My Appointments', href: '/dashboard/appointments', icon: <ClipboardList className="h-5 w-5" /> },
  { title: 'Queue Status', href: '/dashboard/queue', icon: <Users className="h-5 w-5" /> },
];

const adminNavItems: NavItem[] = [
  { title: 'All Bookings', href: '/admin', icon: <LayoutDashboard className="h-5 w-5" /> },
  { title: 'Queue Management', href: '/admin/queue', icon: <Users className="h-5 w-5" /> },
  { title: 'Analytics', href: '/admin/analytics', icon: <BarChart3 className="h-5 w-5" /> },
  { title: 'User Management', href: '/admin/users', icon: <ClipboardList className="h-5 w-5" /> },
  { title: 'Branch Management', href: '/admin/branches', icon: <Building2 className="h-5 w-5" /> },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  variant?: 'customer' | 'admin';
}

export function DashboardLayout({ children, variant = 'customer' }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const navItems = variant === 'admin' ? adminNavItems : customerNavItems;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to={variant === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shadow-lg shadow-primary/20">
            <Scissors className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold gold-text">BarberShop</h1>
            <p className="text-xs text-muted-foreground capitalize">{variant} Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-6">
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <span className={cn(isActive && 'text-primary')}>{item.icon}</span>
                <span className="font-medium">{item.title}</span>
                {isActive && <ChevronRight className="h-4 w-4 ml-auto text-primary" />}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-sidebar-border space-y-4">
        <div className="px-4 py-3 rounded-xl bg-sidebar-accent/50">
          <p className="text-sm font-medium truncate">{profile?.full_name || 'User'}</p>
          <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col bg-sidebar border-r border-sidebar-border">
        <SidebarContent />
      </aside>

      {/* Mobile Header & Sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-xl border-b border-sidebar-border">
        <div className="flex items-center justify-between p-4">
          <Link to={variant === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center">
              <Scissors className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold gold-text">BarberShop</span>
          </Link>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:max-h-screen lg:overflow-auto">
        <div className="pt-20 lg:pt-0 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
