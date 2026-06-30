import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { CartProvider } from "@/contexts/cart-context";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout";

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

const STORE_PATHS = ["/store", "/auth", "/account"];

function isStorePath(path: string) {
  return STORE_PATHS.some(p => path === p || path.startsWith(p + "/"));
}

function Router() {
  return (
    <Switch>
      {/* Store / auth routes — no admin sidebar */}
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />
      <Route path="/store" component={StoreLanding} />
      <Route path="/store/products/:id" component={ProductDetail} />
      <Route path="/store/cart" component={CartPage} />
      <Route path="/store/checkout" component={CheckoutPage} />
      <Route path="/store/orders" component={OrdersList} />
      <Route path="/store/orders/:id" component={OrderDetail} />
      <Route path="/account" component={AccountPage} />

      {/* Admin dashboard routes — wrapped in sidebar Layout */}
      <Route>
        {() => (
          <Layout>
            <Switch>
              <Route path="/">
                <Redirect to="/dashboard" />
              </Route>
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/orders" component={Orders} />
              <Route path="/products" component={Products} />
              <Route path="/customers" component={Customers} />
              <Route path="/customers/:id" component={CustomerDetail} />
              <Route path="/inventory" component={Inventory} />
              <Route path="/analytics" component={Analytics} />
              <Route path="/insights" component={Insights} />
              <Route path="/notifications" component={Notifications} />
              <Route path="/buildforge" component={BuildForge} />
              <Route path="/buildforge/:id" component={BuildForgeSystem} />
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        )}
      </Route>
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
