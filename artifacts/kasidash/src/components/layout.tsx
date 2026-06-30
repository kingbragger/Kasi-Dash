import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  Boxes, 
  BarChart3, 
  Lightbulb, 
  Bell, 
  Blocks, 
  Settings,
  Menu,
  Store,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetHealthCheck } from "@workspace/api-client-react"; // Or whatever the health check hook is named, actually it's useHealthCheck
import { useHealthCheck } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/products", label: "Products", icon: Package },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/buildforge", label: "BuildForge", icon: Blocks },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: health } = useHealthCheck();

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex-shrink-0 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="font-mono font-bold tracking-tight text-xl flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
              <span className="text-primary-foreground text-xs leading-none">K</span>
            </div>
            KasiDash
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}>
                  <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "")} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="px-3 pb-3">
          <Link href="/store">
            <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-primary hover:bg-primary/10 transition-colors cursor-pointer border border-primary/20 bg-primary/5">
              <Store className="w-4 h-4" />
              Visit Store
              <ExternalLink className="w-3 h-3 ml-auto opacity-60" />
            </div>
          </Link>
        </div>

        <div className="p-4 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
          <span>System Status</span>
          <span className="flex items-center gap-1.5">
            <div className={cn("w-2 h-2 rounded-full", health?.status === "ok" ? "bg-green-500" : "bg-red-500")} />
            {health?.status === "ok" ? "Online" : "Offline"}
          </span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-border flex items-center px-4 md:px-6 justify-between flex-shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 sticky top-0">
          <div className="flex items-center gap-4 md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
            <span className="font-mono font-bold">KasiDash</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Link href="/store">
              <Button variant="outline" size="sm" className="gap-1.5 text-primary border-primary/30 hover:bg-primary/10">
                <Store className="w-4 h-4" />
                <span className="hidden sm:inline">Visit Store</span>
              </Button>
            </Link>
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
              </Button>
            </Link>
            <div className="w-8 h-8 rounded-full bg-sidebar-accent border border-border flex items-center justify-center text-sm font-medium">
              M
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
