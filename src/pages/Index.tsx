import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Scissors, Calendar, Users, Star, Loader2 } from 'lucide-react';

export default function Index() {
  const { user, role, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user && role) {
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, role, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-6">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-lg shadow-primary/30">
              <Scissors className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold gold-text">BarberShop Pro</h1>
              <p className="text-xs text-muted-foreground">Premium Grooming</p>
            </div>
          </div>
          <Link to="/login">
            <Button variant="gold">Sign In</Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24">
        <div className="text-center max-w-3xl mx-auto animate-fade-in">
          <h2 className="text-5xl md:text-7xl font-display font-bold mb-6">
            <span className="gold-text">Premium</span> Grooming<br />
            Experience
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Book your appointment at our professional barbershop. Expert stylists, premium services, and a seamless booking experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button variant="gold" size="xl" className="w-full sm:w-auto">
                <Calendar className="h-5 w-5" />
                Book Now
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
                View Services
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Scissors className="h-8 w-8" />,
              title: 'Expert Barbers',
              description: 'Skilled professionals with years of experience in classic and modern styles.',
            },
            {
              icon: <Calendar className="h-8 w-8" />,
              title: 'Easy Booking',
              description: 'Book your appointment online in seconds. Pick your service, date, and time.',
            },
            {
              icon: <Users className="h-8 w-8" />,
              title: 'Real-time Queue',
              description: 'Track your position in the queue and get notified when it\'s your turn.',
            },
          ].map((feature, index) => (
            <div
              key={feature.title}
              className="glass-card p-8 rounded-2xl text-center animate-fade-in"
              style={{ animationDelay: `${0.2 + index * 0.1}s` }}
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 text-primary">
                {feature.icon}
              </div>
              <h3 className="text-xl font-display font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Services Preview */}
        <div className="mt-24 text-center animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <h3 className="text-3xl font-display font-bold mb-12 gold-text">Our Services</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: 'Basic Haircut', price: '₱150' },
              { name: 'Premium Haircut', price: '₱250' },
              { name: 'Beard Trim', price: '₱100' },
              { name: 'Shave', price: '₱120' },
              { name: 'Hair Color', price: '₱500' },
              { name: 'Styling', price: '₱200' },
            ].map((service) => (
              <div
                key={service.name}
                className="glass-card p-4 rounded-xl hover:border-primary/30 transition-colors"
              >
                <p className="font-medium text-sm mb-1">{service.name}</p>
                <p className="text-primary font-semibold">{service.price}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="glass-card p-12 rounded-3xl border-primary/30 max-w-2xl mx-auto">
            <div className="flex justify-center mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-6 w-6 text-primary fill-primary" />
              ))}
            </div>
            <h3 className="text-2xl font-display font-bold mb-4">Ready for a Fresh Look?</h3>
            <p className="text-muted-foreground mb-6">
              Join thousands of satisfied customers. Book your appointment today!
            </p>
            <Link to="/login">
              <Button variant="gold" size="lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© 2024 BarberShop Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
