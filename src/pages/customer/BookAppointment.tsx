import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SERVICE_CONFIG, PAYMENT_METHODS, TIME_SLOTS, ServiceType, PaymentMethod } from '@/lib/constants';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  CalendarIcon,
  Clock,
  Scissors,
  Crown,
  Sparkles,
  Slash,
  Palette,
  Wand2,
  Smartphone,
  Banknote,
  CreditCard,
  Users,
  Loader2,
  Check,
} from 'lucide-react';

const serviceIcons: Record<ServiceType, React.ReactNode> = {
  basic_haircut: <Scissors className="h-5 w-5" />,
  premium_haircut: <Crown className="h-5 w-5" />,
  beard_trim: <Sparkles className="h-5 w-5" />,
  shave: <Slash className="h-5 w-5" />,
  hair_color: <Palette className="h-5 w-5" />,
  styling: <Wand2 className="h-5 w-5" />,
};

const paymentIcons: Record<PaymentMethod, React.ReactNode> = {
  gcash: <Smartphone className="h-5 w-5" />,
  cash: <Banknote className="h-5 w-5" />,
  card: <CreditCard className="h-5 w-5" />,
};

const bookingSchema = z.object({
  branchId: z.string().min(1, 'Please select a branch'),
  serviceType: z.string().min(1, 'Please select a service'),
  numberOfPax: z.number().min(1).max(10),
  bookingDate: z.date({ required_error: 'Please select a date' }),
  bookingTime: z.string().min(1, 'Please select a time'),
  paymentMethod: z.string().min(1, 'Please select a payment method'),
});

export default function BookAppointment() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [branchId, setBranchId] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType | ''>('');
  const [numberOfPax, setNumberOfPax] = useState(1);
  const [bookingDate, setBookingDate] = useState<Date>();
  const [bookingTime, setBookingTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: branches, isLoading: branchesLoading } = useQuery({
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

  const createBookingMutation = useMutation({
    mutationFn: async (data: {
      user_id: string;
      branch_id: string;
      service_type: ServiceType;
      number_of_pax: number;
      duration_minutes: number;
      booking_date: string;
      booking_time: string;
      total_cost: number;
      payment_method: PaymentMethod;
      notes?: string;
    }) => {
      const { error } = await supabase.from('bookings').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Booking Confirmed!',
        description: 'Your appointment has been successfully booked.',
      });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      // Reset form
      setBranchId('');
      setServiceType('');
      setNumberOfPax(1);
      setBookingDate(undefined);
      setBookingTime('');
      setPaymentMethod('');
      setNotes('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Booking Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const totalCost = serviceType ? SERVICE_CONFIG[serviceType].price * numberOfPax : 0;
  const duration = serviceType ? SERVICE_CONFIG[serviceType].duration * numberOfPax : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      bookingSchema.parse({
        branchId,
        serviceType,
        numberOfPax,
        bookingDate,
        bookingTime,
        paymentMethod,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[String(err.path[0])] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }
    }

    if (!profile?.id) {
      toast({
        title: 'Error',
        description: 'Please log in to book an appointment.',
        variant: 'destructive',
      });
      return;
    }

    createBookingMutation.mutate({
      user_id: profile.id,
      branch_id: branchId,
      service_type: serviceType as ServiceType,
      number_of_pax: numberOfPax,
      duration_minutes: duration,
      booking_date: format(bookingDate!, 'yyyy-MM-dd'),
      booking_time: bookingTime,
      total_cost: totalCost,
      payment_method: paymentMethod as PaymentMethod,
      notes: notes || undefined,
    });
  };

  return (
    <DashboardLayout variant="customer">
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-display font-bold gold-text">Book Appointment</h1>
          <p className="text-muted-foreground mt-2">Schedule your next grooming session</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Branch Selection */}
          <Card className="glass-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="text-lg">Select Branch</CardTitle>
              <CardDescription>Choose your preferred location</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {branches?.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      <div>
                        <p className="font-medium">{branch.name}</p>
                        <p className="text-xs text-muted-foreground">{branch.address}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.branchId && <p className="text-sm text-destructive mt-2">{errors.branchId}</p>}
            </CardContent>
          </Card>

          {/* Service Selection */}
          <Card className="glass-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="text-lg">Select Service</CardTitle>
              <CardDescription>Choose your desired service</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(Object.entries(SERVICE_CONFIG) as [ServiceType, typeof SERVICE_CONFIG[ServiceType]][]).map(
                  ([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setServiceType(key)}
                      className={cn(
                        'p-4 rounded-xl border transition-all duration-200 text-left',
                        serviceType === key
                          ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                          : 'border-border bg-secondary hover:bg-secondary/80'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={serviceType === key ? 'text-primary' : 'text-muted-foreground'}>
                          {serviceIcons[key]}
                        </span>
                        {serviceType === key && <Check className="h-4 w-4 text-primary ml-auto" />}
                      </div>
                      <p className="font-medium text-sm">{config.name}</p>
                      <p className="text-primary font-semibold">₱{config.price}</p>
                      <p className="text-xs text-muted-foreground">{config.duration} mins</p>
                    </button>
                  )
                )}
              </div>
              {errors.serviceType && <p className="text-sm text-destructive mt-2">{errors.serviceType}</p>}
            </CardContent>
          </Card>

          {/* Number of People */}
          <Card className="glass-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="text-lg">Number of People</CardTitle>
              <CardDescription>How many people will be getting this service?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Users className="h-5 w-5 text-muted-foreground" />
                <Select value={String(numberOfPax)} onValueChange={(v) => setNumberOfPax(Number(v))}>
                  <SelectTrigger className="w-32 bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} {n === 1 ? 'person' : 'people'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Date & Time */}
          <Card className="glass-card animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <CardTitle className="text-lg">Date & Time</CardTitle>
              <CardDescription>When would you like to visit?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label className="mb-2 block">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal bg-secondary border-border',
                          !bookingDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {bookingDate ? format(bookingDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                      <Calendar
                        mode="single"
                        selected={bookingDate}
                        onSelect={setBookingDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.bookingDate && <p className="text-sm text-destructive mt-1">{errors.bookingDate}</p>}
                </div>

                <div className="flex-1">
                  <Label className="mb-2 block">Time</Label>
                  <Select value={bookingTime} onValueChange={setBookingTime}>
                    <SelectTrigger className="bg-secondary border-border">
                      <Clock className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border max-h-60">
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.bookingTime && <p className="text-sm text-destructive mt-1">{errors.bookingTime}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card className="glass-card animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <CardHeader>
              <CardTitle className="text-lg">Payment Method</CardTitle>
              <CardDescription>How would you like to pay?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {(Object.entries(PAYMENT_METHODS) as [PaymentMethod, typeof PAYMENT_METHODS[PaymentMethod]][]).map(
                  ([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPaymentMethod(key)}
                      className={cn(
                        'flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200',
                        paymentMethod === key
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-secondary hover:bg-secondary/80 text-foreground'
                      )}
                    >
                      {paymentIcons[key]}
                      <span className="font-medium">{config.name}</span>
                    </button>
                  )
                )}
              </div>
              {errors.paymentMethod && <p className="text-sm text-destructive mt-2">{errors.paymentMethod}</p>}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="glass-card animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <CardHeader>
              <CardTitle className="text-lg">Additional Notes</CardTitle>
              <CardDescription>Any special requests or instructions?</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g., specific style preferences, allergies, etc."
                className="bg-secondary border-border resize-none"
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Summary & Submit */}
          <Card className="glass-card border-primary/30 animate-fade-in" style={{ animationDelay: '0.7s' }}>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="text-3xl font-bold text-success">₱{totalCost.toLocaleString()}</p>
                  {duration > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Estimated duration: {duration} minutes
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  variant="gold"
                  size="lg"
                  disabled={createBookingMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {createBookingMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
