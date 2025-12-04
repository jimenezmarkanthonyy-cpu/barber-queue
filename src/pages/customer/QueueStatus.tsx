import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SERVICE_CONFIG, ServiceType } from '@/lib/constants';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Clock,
  MapPin,
  Hash,
  Users,
  Zap,
  WashingMachine,
} from 'lucide-react';

export default function QueueStatus() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: queueData, isLoading } = useQuery({
    queryKey: ['queue-status', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          branch:branches(name, address),
          profile:profiles(full_name)
        `)
        .eq('booking_date', today)
        .in('booking_status', ['pending', 'confirmed', 'in_progress'])
        .not('queue_number', 'is', null)
        .order('queue_number');
      if (error) throw error;
      return data;
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('queue-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['queue-status'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const myBooking = queueData?.find(
    (b) => b.user_id === profile?.id && b.booking_status !== 'completed'
  );

  const nowServing = queueData?.find((b) => b.booking_status === 'in_progress');
  const waiting = queueData?.filter((b) => b.booking_status !== 'in_progress' && b.booking_status !== 'completed');

  return (
    <DashboardLayout variant="customer">
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Queue Status</h1>
          <p className="text-muted-foreground mt-2">Real-time order tracking for today</p>
        </div>

        {/* My Position */}
        {myBooking && (
          <Card className="glass-card border-primary mb-6 animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <WashingMachine className="h-5 w-5 text-primary" />
                Your Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold text-white">
                    #{myBooking.queue_number}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    {SERVICE_CONFIG[myBooking.service_type as ServiceType]?.name || myBooking.service_type}
                  </p>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {myBooking.booking_time}
                  </p>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {myBooking.branch?.name}
                  </p>
                  <Badge
                    variant={myBooking.booking_status === 'in_progress' ? 'in_progress' : 'confirmed'}
                    className="mt-2"
                  >
                    {myBooking.booking_status === 'in_progress' ? 'Processing Now' : 'In Queue'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Now Processing */}
        {nowServing && (
          <Card className="glass-card border-green-500/50 mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-green-600">
                <Zap className="h-5 w-5" />
                Now Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <span className="text-2xl font-bold text-green-600">#{nowServing.queue_number}</span>
                </div>
                <div>
                  <p className="font-semibold">{SERVICE_CONFIG[nowServing.service_type as ServiceType]?.name}</p>
                  <p className="text-sm text-muted-foreground">{nowServing.branch?.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Queue List */}
        <Card className="glass-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Today's Queue
            </CardTitle>
            <CardDescription>
              {waiting?.length || 0} orders waiting
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : queueData && queueData.length > 0 ? (
              <div className="space-y-3">
                {queueData.map((item) => {
                  const isMyBooking = item.user_id === profile?.id;
                  const isServing = item.booking_status === 'in_progress';

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-xl transition-all',
                        isMyBooking
                          ? 'bg-primary/10 border border-primary/30'
                          : isServing
                          ? 'bg-green-100 dark:bg-green-900/20 border border-green-500/30'
                          : 'bg-secondary/50'
                      )}
                    >
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center font-bold',
                          isServing ? 'bg-green-200 dark:bg-green-900/50 text-green-600' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        <Hash className="h-4 w-4 mr-0.5" />
                        {item.queue_number}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {SERVICE_CONFIG[item.service_type as ServiceType]?.name}
                          </p>
                          {isServing && (
                            <Badge variant="in_progress" className="text-xs">Processing</Badge>
                          )}
                          {isMyBooking && !isServing && (
                            <Badge variant="confirmed" className="text-xs">Your Order</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {item.booking_time}
                          <span className="mx-1">•</span>
                          <MapPin className="h-3 w-3" />
                          {item.branch?.name}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <WashingMachine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No orders in queue yet today</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
