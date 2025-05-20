
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";

// Pages
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

// Owner routes
import AdminDashboard from "./pages/owner/AdminDashboard";
import BrandSetup from "./pages/owner/BrandSetup";
import BranchManagement from "./pages/owner/BranchManagement";
import StoreManagement from "./pages/owner/StoreManagement";
import CategoryManagement from "./pages/owner/CategoryManagement";
import MenuManagement from "./pages/owner/MenuManagement";
import StockManagement from "./pages/owner/StockManagement";
import UserManagement from "./pages/owner/UserManagement";
import SalesReport from "./pages/owner/SalesReport";

// Manager routes
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import StockControl from "./pages/manager/StockControl";
import ManagerSalesReport from "./pages/manager/SalesReport";
import StoreSettings from "./pages/manager/StoreSettings";

// Cashier routes
import POSInterface from "./pages/cashier/POSInterface";
import TransactionHistory from "./pages/cashier/TransactionHistory";

// Create a PWA provider
import { PwaProvider } from "./context/PwaContext";

const queryClient = new QueryClient();

// Role-based route protection
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}> = ({ children, allowedRoles, redirectTo = '/login' }) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }
  
  return <>{children}</>;
};

// Redirect based on role
const RoleBasedRedirect = () => {
  const { user } = useAuth();
  
  if (user?.role === 'owner') {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (user?.role === 'manager') {
    return <Navigate to="/manager/dashboard" replace />;
  } else if (user?.role === 'cashier') {
    return <Navigate to="/pos" replace />;
  }
  
  return <Navigate to="/login" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PwaProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<RoleBasedRedirect />} />
              
              {/* Owner routes */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/brand" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <BrandSetup />
                </ProtectedRoute>
              } />
              <Route path="/admin/branches" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <BranchManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/stores" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <StoreManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/categories" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <CategoryManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/menu" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <MenuManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/stock" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <StockManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <UserManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/reports" element={
                <ProtectedRoute allowedRoles={['owner']}>
                  <SalesReport />
                </ProtectedRoute>
              } />
              
              {/* Manager routes */}
              <Route path="/manager/dashboard" element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/manager/stock" element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <StockControl />
                </ProtectedRoute>
              } />
              <Route path="/manager/reports" element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <ManagerSalesReport />
                </ProtectedRoute>
              } />
              <Route path="/manager/settings" element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <StoreSettings />
                </ProtectedRoute>
              } />
              
              {/* Cashier routes */}
              <Route path="/pos" element={
                <ProtectedRoute allowedRoles={['cashier', 'manager']}>
                  <POSInterface />
                </ProtectedRoute>
              } />
              <Route path="/pos/history" element={
                <ProtectedRoute allowedRoles={['cashier', 'manager']}>
                  <TransactionHistory />
                </ProtectedRoute>
              } />
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </PwaProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
