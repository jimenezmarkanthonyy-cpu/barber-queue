import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  Building2,
  MapPin,
  Phone,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';

const branchSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  phone: z.string().optional(),
  is_active: z.boolean(),
});

export default function BranchManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: branches, isLoading } = useQuery({
    queryKey: ['admin-branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: branchBookingCounts } = useQuery({
    queryKey: ['branch-booking-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('branch_id');
      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((b) => {
        counts[b.branch_id] = (counts[b.branch_id] || 0) + 1;
      });
      return counts;
    },
  });

  const createBranchMutation = useMutation({
    mutationFn: async (data: { name: string; address: string; phone?: string; is_active: boolean }) => {
      const { error } = await supabase.from('branches').insert([{
        name: data.name,
        address: data.address,
        phone: data.phone || null,
        is_active: data.is_active,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
      toast({ title: 'Branch created successfully' });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateBranchMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof branchSchema> }) => {
      const { error } = await supabase.from('branches').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
      toast({ title: 'Branch updated successfully' });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteBranchMutation = useMutation({
    mutationFn: async (id: string) => {
      const count = branchBookingCounts?.[id] || 0;
      if (count > 0) {
        throw new Error('Cannot delete branch with existing bookings');
      }
      const { error } = await supabase.from('branches').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
      toast({ title: 'Branch deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBranch(null);
    setFormData({ name: '', address: '', phone: '', is_active: true });
    setErrors({});
  };

  const handleEdit = (branch: any) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone || '',
      is_active: branch.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      branchSchema.parse(formData);
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

    if (editingBranch) {
      updateBranchMutation.mutate({ id: editingBranch.id, data: formData });
    } else {
      createBranchMutation.mutate(formData);
    }
  };

  const isPending = createBranchMutation.isPending || updateBranchMutation.isPending;

  return (
    <DashboardLayout variant="admin">
      <div className="p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold gold-text">Branch Management</h1>
            <p className="text-muted-foreground mt-2">Manage your shop locations</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" onClick={() => handleCloseDialog()}>
                <Plus className="h-4 w-4" />
                Add Branch
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
                  <DialogDescription>
                    {editingBranch ? 'Update branch details' : 'Create a new branch location'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Branch Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Downtown Branch"
                      className="bg-secondary border-border"
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Full address"
                      className="bg-secondary border-border"
                    />
                    {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(02) 8123-4567"
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="is_active">Active</Label>
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="gold" disabled={isPending}>
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : editingBranch ? (
                      'Update'
                    ) : (
                      'Create'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Branches Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches?.map((branch, index) => (
              <Card
                key={branch.id}
                className="glass-card animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{branch.name}</CardTitle>
                        <Badge variant={branch.is_active ? 'success' : 'secondary'}>
                          {branch.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{branch.address}</span>
                  </div>
                  {branch.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{branch.phone}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      Total Bookings: <span className="font-semibold text-foreground">
                        {branchBookingCounts?.[branch.id] || 0}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(branch)}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Branch</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this branch? Branches with existing bookings cannot be deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-secondary">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteBranchMutation.mutate(branch.id)}
                            className="bg-destructive"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
