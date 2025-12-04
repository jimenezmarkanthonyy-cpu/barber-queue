import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { SERVICE_CONFIG, ServiceType } from '@/lib/constants';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Play,
  SkipForward,
  Check,
  Clock,
  Hash,
  Zap,
} from 'lucide-react';

export default function QueueManagement() {
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranch) {
      setSelectedBranch(branches[0].id);
    }
  }, [branches, selectedBranch]);

  const { data: queueData, isLoading } = useQuery({
    queryKey: ['admin-queue', selectedBranch, today],
    queryFn: async () => {
      if (!selectedBranch) return [];
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          profile:profiles(full_name, email)
        `)
        .eq('branch_id', selectedBranch)
        .eq('booking_date', today)
        .in('booking_status', ['pending', 'confirmed', 'in_progress'])
        .order('booking_time');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBranch,
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-queue-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-queue'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase.from('bookings').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-queue'] });
      toast({ title: 'Queue updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const nowServing = queueData?.find((b) => b.booking_status === 'in_progress');
  const waiting = queueData?.filter((b) => b.booking_status !== 'in_progress') || [];
  const totalToday = queueData?.length || 0;

  const handleCallNext = async () => {
    // Complete current if any
    if (nowServing) {
      await updateBookingMutation.mutateAsync({
        id: nowServing.id,
        updates: { booking_status: 'completed' },
      });
    }

    // Start next
    const next = waiting[0];
    if (next) {
      const maxQueue = Math.max(...(queueData?.map((b) => b.queue_number || 0) || [0]));
      await updateBookingMutation.mutateAsync({
        id: next.id,
        updates: {
          booking_status: 'in_progress',
          queue_number: next.queue_number || maxQueue + 1,
        },
      });
    }
  };

  const handleSkip = async () => {
    if (nowServing) {
      await updateBookingMutation.mutateAsync({
        id: nowServing.id,
        updates: { booking_status: 'cancelled' },
      });
      handleCallNext();
    }
  };

  const handleComplete = async () => {
    if (nowServing) {
      await updateBookingMutation.mutateAsync({
        id: nowServing.id,
        updates: { booking_status: 'completed' },
      });
    }
  };

  const handleAssignQueue = async (bookingId: string) => {
    const maxQueue = Math.max(...(queueData?.map((b) => b.queue_number || 0) || [0]));
    await updateBookingMutation.mutateAsync({
      id: bookingId,
      updates: {
        queue_number: maxQueue + 1,
        booking_status: 'confirmed',
      },
    });
  };

  return (
    <DashboardLayout variant="admin">
      <div className="p-6 lg:p-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-display font-bold gold-text">Queue Management</h1>
          <p className="text-muted-foreground mt-2">Manage today's queue in real-time</p>
        </div>

        {/* Branch Selector */}
        <Card className="glass-card mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardContent className="pt-6">
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-full sm:w-64 bg-secondary border-border">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {branches?.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="glass-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-success/20 flex items-center justify-center">
                  <Zap className="h-7 w-7 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Now Serving</p>
                  <p className="text-3xl font-bold">
                    {nowServing?.queue_number ? `#${nowServing.queue_number}` : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Queue</p>
                  <p className="text-3xl font-bold">{waiting.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                  <Clock className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Today</p>
                  <p className="text-3xl font-bold">{totalToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queue Controls */}
        <Card className="glass-card mb-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <CardHeader>
            <CardTitle>Queue Controls</CardTitle>
            <CardDescription>Manage the current queue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="gold"
                onClick={handleCallNext}
                disabled={waiting.length === 0 && !nowServing}
              >
                <Play className="h-4 w-4" />
                Call Next
              </Button>
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={!nowServing}
              >
                <SkipForward className="h-4 w-4" />
                Skip
              </Button>
              <Button
                variant="success"
                onClick={handleComplete}
                disabled={!nowServing}
              >
                <Check className="h-4 w-4" />
                Complete
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Now Serving */}
        {nowServing && (
          <Card className="glass-card border-success/50 mb-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-success">
                <Zap className="h-5 w-5" />
                Now Serving
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-success/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-success">#{nowServing.queue_number}</span>
                </div>
                <div>
                  <p className="font-semibold text-lg">{nowServing.profile?.full_name}</p>
                  <p className="text-muted-foreground">
                    {SERVICE_CONFIG[nowServing.service_type as ServiceType].name}
                  </p>
                  <p className="text-sm text-muted-foreground">{nowServing.booking_time}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Queue List */}
        <Card className="glass-card animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <CardHeader>
            <CardTitle>Queue</CardTitle>
            <CardDescription>{waiting.length} waiting</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : waiting.length > 0 ? (
              <div className="space-y-3">
                {waiting.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50"
                  >
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      {item.queue_number ? (
                        <span className="font-bold">#{item.queue_number}</span>
                      ) : (
                        <Hash className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.profile?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {SERVICE_CONFIG[item.service_type as ServiceType].name} • {item.booking_time}
                      </p>
                    </div>
                    {!item.queue_number && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAssignQueue(item.id)}
                      >
                        Assign Queue
                      </Button>
                    )}
                    <Badge variant={item.booking_status === 'confirmed' ? 'confirmed' : 'pending'}>
                      {item.booking_status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No one in queue</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
