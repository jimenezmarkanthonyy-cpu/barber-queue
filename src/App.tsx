import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Customer Pages
import BookAppointment from "./pages/customer/BookAppointment";
import MyAppointments from "./pages/customer/MyAppointments";
import QueueStatus from "./pages/customer/QueueStatus";

// Admin Pages
import AllBookings from "./pages/admin/AllBookings";
import QueueManagement from "./pages/admin/QueueManagement";
import Analytics from "./pages/admin/Analytics";
import UserManagement from "./pages/admin/UserManagement";
import BranchManagement from "./pages/admin/BranchManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Auth />} />

            {/* Customer Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="customer">
                  <BookAppointment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/appointments"
              element={
                <ProtectedRoute requiredRole="customer">
                  <MyAppointments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/queue"
              element={
                <ProtectedRoute requiredRole="customer">
                  <QueueStatus />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AllBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/queue"
              element={
                <ProtectedRoute requiredRole="admin">
                  <QueueManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute requiredRole="admin">
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/branches"
              element={
                <ProtectedRoute requiredRole="admin">
                  <BranchManagement />
                </ProtectedRoute>
              }
            />

            {/* Catch All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
