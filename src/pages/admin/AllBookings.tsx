import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { SERVICE_CONFIG, BOOKING_STATUS_CONFIG, ServiceType, BookingStatus } from '@/lib/constants';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Trash2, Loader2 } from 'lucide-react';

export default function AllBookings() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          branch:branches(name),
          profile:profiles(full_name, email)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-bookings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast({ title: 'Status updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast({ title: 'Booking deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const filteredBookings = bookings?.filter((booking) => {
    const matchesSearch =
      booking.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      booking.profile?.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.booking_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout variant="admin">
      <div className="p-6 lg:p-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-display font-bold gold-text">All Bookings</h1>
          <p className="text-muted-foreground mt-2">Manage all customer bookings</p>
        </div>

        {/* Filters */}
        <Card className="glass-card mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-secondary border-border">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(BOOKING_STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card className="glass-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <CardTitle>Bookings ({filteredBookings?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Customer</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Pax</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Queue #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings?.map((booking) => (
                      <TableRow key={booking.id} className="border-border">
                        <TableCell>
                          <div>
                            <p className="font-medium">{booking.profile?.full_name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{booking.profile?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{booking.branch?.name}</TableCell>
                        <TableCell>
                          {SERVICE_CONFIG[booking.service_type as ServiceType]?.name}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{format(new Date(booking.booking_date), 'MMM d, yyyy')}</p>
                            <p className="text-xs text-muted-foreground">{booking.booking_time}</p>
                          </div>
                        </TableCell>
                        <TableCell>{booking.number_of_pax}</TableCell>
                        <TableCell className="text-success font-semibold">
                          ₱{Number(booking.total_cost).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {booking.queue_number ? (
                            <Badge variant="outline">#{booking.queue_number}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={booking.booking_status}
                            onValueChange={(value) =>
                              updateStatusMutation.mutate({ id: booking.id, status: value as BookingStatus })
                            }
                          >
                            <SelectTrigger className="w-32 h-8 text-xs bg-transparent border-none">
                              <Badge variant={booking.booking_status as BookingStatus}>
                                {BOOKING_STATUS_CONFIG[booking.booking_status as BookingStatus]?.label}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                              {Object.entries(BOOKING_STATUS_CONFIG).map(([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  {config.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Booking</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this booking? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-secondary">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteBookingMutation.mutate(booking.id)}
                                  className="bg-destructive"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
