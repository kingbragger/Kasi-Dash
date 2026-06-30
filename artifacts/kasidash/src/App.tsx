import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { CartProvider } from "@/contexts/cart-context";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";
import { Loader2 } from "lucide-react";

import Dashboard from "@/pages/dashboard";
import Orders from "@/pages/orders";
import Products from "@/pages/products";
import Customers from "@/pages/customers";
import CustomerDetail from "@/pages/customer-detail";
import Inventory from "@/pages/inventory";
import Analytics from "@/pages/analytics";
import Insights from "@/pages/insights";
import Notifications from "@/pages/notifications";
import BuildForge from "@/pages/buildforge-landing";
import BuildForgeSystem from "@/pages/buildforge-system";
import Settings from "@/pages/settings";

import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import StoreLanding from "@/pages/store/store-landing";
import ProductDetail from "@/pages/store/product-detail";
import CartPage from "@/pages/store/cart-page";
import CheckoutPage from "@/pages/store/checkout-page";
import { OrdersList, OrderDetail } from "@/pages/store/orders-page";
import AccountPage from "@/pages/store/account-page";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return <Redirect to={`/auth/login?next=${encodeURIComponent(location)}`} />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Root → store */}
      <Route path="/">
        <Redirect to="/store" />
      </Route>

      {/* Auth pages */}
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />

      {/* Customer store */}
      <Route path="/store" component={StoreLanding} />
      <Route path="/store/products/:id" component={ProductDetail} />
      <Route path="/store/cart" component={CartPage} />
      <Route path="/store/checkout" component={CheckoutPage} />
      <Route path="/store/orders" component={OrdersList} />
      <Route path="/store/orders/:id" component={OrderDetail} />
      <Route path="/account" component={AccountPage} />

      {/* Admin-only routes — behind role guard */}
      <Route path="/dashboard">
        <AdminGuard>
          <Layout><Dashboard /></Layout>
        </AdminGuard>
      </Route>
      <Route path="/orders">
        <AdminGuard>
          <Layout><Orders /></Layout>
        </AdminGuard>
      </Route>
      <Route path="/products">
        <AdminGuard>
          <Layout><Products /></Layout>
        </AdminGuard>
      </Route>
      <Route path="/customers">
        <AdminGuard>
          <Layout><Customers /></Layout>
        </AdminGuard>
      </Route>
      <Route path="/customers/:id">
        {(params) => (
          <AdminGuard>
            <Layout><CustomerDetail /></Layout>
          </AdminGuard>
        )}
      </Route>
      <Route path="/inventory">
        <AdminGuard>
          <Layout><Inventory /></Layout>
        </AdminGuard>
      </Route>
      <Route path="/analytics">
        <AdminGuard>
          <Layout><Analytics /></Layout>
        </AdminGuard>
      </Route>
      <Route path="/insights">
        <AdminGuard>
          <Layout><Insights /></Layout>
        </AdminGuard>
      </Route>
      <Route path="/notifications">
        <AdminGuard>
          <Layout><Notifications /></Layout>
        </AdminGuard>
      </Route>
      <Route path="/buildforge">
        <AdminGuard>
          <Layout><BuildForge /></Layout>
        </AdminGuard>
      </Route>
      <Route path="/buildforge/:id">
        {() => (
          <AdminGuard>
            <Layout><BuildForgeSystem /></Layout>
          </AdminGuard>
        )}
      </Route>
      <Route path="/settings">
        <AdminGuard>
          <Layout><Settings /></Layout>
        </AdminGuard>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="kasidash-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthProvider>
              <CartProvider>
                <Router />
              </CartProvider>
            </AuthProvider>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
