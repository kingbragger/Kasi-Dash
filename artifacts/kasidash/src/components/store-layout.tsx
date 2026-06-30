import { Link, useLocation } from "wouter";
import { ShoppingCart, User, LogOut, Package, Store, ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function StoreLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLocation("/auth/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/store">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                  <Store className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg hidden sm:block">KBT Store</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/store">
                <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Products</span>
              </Link>
              {user && (
                <Link href="/store/orders">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">My Orders</span>
                </Link>
              )}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Link href="/store/cart">
                <Button variant="ghost" size="sm" className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {cart.itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {cart.itemCount > 99 ? "99+" : cart.itemCount}
                    </span>
                  )}
                </Button>
              </Link>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="hidden sm:block text-sm max-w-[120px] truncate">{user.name.split(" ")[0]}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/store/orders">
                        <Package className="w-4 h-4 mr-2" /> My Orders
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account">
                        <User className="w-4 h-4 mr-2" /> My Account
                      </Link>
                    </DropdownMenuItem>
                    {user.role === "admin" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard">
                            <Store className="w-4 h-4 mr-2" /> Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/auth/register">Register</Link>
                  </Button>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border py-3 space-y-1">
              <Link href="/store">
                <div className="block px-3 py-2 text-sm rounded-md hover:bg-accent cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
                  Products
                </div>
              </Link>
              {user ? (
                <>
                  <Link href="/store/orders">
                    <div className="block px-3 py-2 text-sm rounded-md hover:bg-accent cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
                      My Orders
                    </div>
                  </Link>
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-destructive rounded-md hover:bg-accent">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login">
                    <div className="block px-3 py-2 text-sm rounded-md hover:bg-accent cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
                      Sign In
                    </div>
                  </Link>
                  <Link href="/auth/register">
                    <div className="block px-3 py-2 text-sm rounded-md hover:bg-accent cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
                      Register
                    </div>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="border-t border-border mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} KasiDash & BuildForge Tech Store. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
