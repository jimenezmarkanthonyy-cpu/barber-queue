import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SERVICE_CONFIG, BOOKING_STATUS_CONFIG, ServiceType, BookingStatus } from '@/lib/constants';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Clock,
  MapPin,
  Package,
  Hash,
  FileText,
  Shirt,
  Sparkles,
  Flame,
  Droplets,
  Wind,
  Zap,
  BedDouble,
  ClipboardList,
} from 'lucide-react';

const serviceIcons: Record<ServiceType, React.ReactNode> = {
  wash_fold: <Shirt className="h-5 w-5" />,
  dry_clean: <Sparkles className="h-5 w-5" />,
  ironing: <Flame className="h-5 w-5" />,
  wash_only: <Droplets className="h-5 w-5" />,
  dry_only: <Wind className="h-5 w-5" />,
  express: <Zap className="h-5 w-5" />,
  bedding: <BedDouble className="h-5 w-5" />,
};

export default function MyAppointments() {
  const { profile } = useAuth();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['my-bookings', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          branch:branches(name, address)
        `)
        .eq('user_id', profile.id)
        .order('booking_date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  return (
    <DashboardLayout variant="customer">
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold gradient-text">My Orders</h1>
          <p className="text-muted-foreground mt-2">Track your laundry orders</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="w-12 h-12 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-60" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : bookings && bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking, index) => {
              const service = SERVICE_CONFIG[booking.service_type as ServiceType];
              const status = BOOKING_STATUS_CONFIG[booking.booking_status as BookingStatus];

              return (
                <Card
                  key={booking.id}
                  className="glass-card animate-fade-in hover:border-primary/30 transition-colors"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Service Icon */}
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {serviceIcons[booking.service_type as ServiceType]}
                      </div>

                      {/* Details */}
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-lg">{service?.name || booking.service_type}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{booking.branch?.name}</span>
                            </div>
                          </div>
                          <Badge variant={booking.booking_status as BookingStatus}>
                            {status?.label || booking.booking_status}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(booking.booking_date), 'PPP')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{booking.booking_time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Package className="h-4 w-4" />
                            <span>{booking.number_of_pax} {service?.unit === 'per kg' ? 'kg' : 'pcs'}</span>
                          </div>
                          {booking.queue_number && (
                            <div className="flex items-center gap-2 text-primary">
                              <Hash className="h-4 w-4" />
                              <span className="font-semibold">Queue #{booking.queue_number}</span>
                            </div>
                          )}
                        </div>

                        {booking.notes && (
                          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                            <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>{booking.notes}</span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-border">
                          <p className="text-sm text-muted-foreground">Total Cost</p>
                          <p className="text-xl font-bold text-green-600">
                            ₱{Number(booking.total_cost).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="glass-card animate-fade-in">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
              <p className="text-muted-foreground">
                You haven't placed any laundry orders yet. Start your first order today!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
