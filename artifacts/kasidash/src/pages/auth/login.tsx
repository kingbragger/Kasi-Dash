import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, ShieldCheck, Zap, Headphones } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const nextParam = new URLSearchParams(window.location.search).get("next") || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      if (nextParam && nextParam.startsWith("/")) {
        setLocation(nextParam);
      } else if (user.role === "admin") {
        setLocation("/dashboard");
      } else {
        setLocation("/store");
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-950 flex-col justify-between p-12 relative overflow-hidden border-r border-zinc-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary/5 rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none" />

        <Link href="/store">
          <div className="flex items-center gap-3 cursor-pointer">
            <svg width="40" height="40" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="180" height="180" rx="40" fill="url(#lp-bg)"/>
              <defs>
                <linearGradient id="lp-bg" x1="0" y1="0" x2="180" y2="180" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#16a34a"/>
                  <stop offset="100%" stopColor="#15803d"/>
                </linearGradient>
              </defs>
              <rect x="44" y="76" width="92" height="68" rx="10" fill="white" fillOpacity="0.95"/>
              <path d="M68 76 Q68 46 90 46 Q112 46 112 76" stroke="white" strokeWidth="9" strokeLinecap="round" fill="none"/>
              <path d="M97 96 L84 108 L91 108 L83 124 L96 110 L89 110 Z" fill="#16a34a"/>
            </svg>
            <span className="text-white font-bold text-xl">KBT Store</span>
          </div>
        </Link>

        <div className="space-y-8 relative z-10">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Quality tech,<br />trusted prices.
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Premium refurbished phones, laptops, and desktops — inspected and ready to go.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: ShieldCheck, title: "Verified quality", desc: "Every device inspected before sale" },
              { icon: Zap, title: "Fast delivery", desc: "Gauteng & nationwide shipping" },
              { icon: Headphones, title: "After-sale support", desc: "Help when you need it" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-9 h-9 bg-zinc-800 border border-zinc-700 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-zinc-200 font-medium text-sm">{title}</p>
                  <p className="text-zinc-500 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-zinc-600 text-sm">© {new Date().getFullYear()} KasiDash & BuildForge</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center">
            <Link href="/store">
              <div className="flex items-center gap-2 cursor-pointer">
                <svg width="36" height="36" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="180" height="180" rx="40" fill="url(#lm-bg)"/>
                  <defs>
                    <linearGradient id="lm-bg" x1="0" y1="0" x2="180" y2="180" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#16a34a"/>
                      <stop offset="100%" stopColor="#15803d"/>
                    </linearGradient>
                  </defs>
                  <rect x="44" y="76" width="92" height="68" rx="10" fill="white" fillOpacity="0.95"/>
                  <path d="M68 76 Q68 46 90 46 Q112 46 112 76" stroke="white" strokeWidth="9" strokeLinecap="round" fill="none"/>
                  <path d="M97 96 L84 108 L91 108 L83 124 L96 110 L89 110 Z" fill="#16a34a"/>
                </svg>
                <span className="font-bold text-xl">KBT Store</span>
              </div>
            </Link>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
            <p className="mt-2 text-muted-foreground">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/auth/forgot-password">
                  <span className="text-sm text-primary hover:underline cursor-pointer">Forgot password?</span>
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in…</> : "Sign In"}
            </Button>
          </form>

          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/auth/register">
                <span className="text-primary hover:underline cursor-pointer font-semibold">Create one free</span>
              </Link>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Merchant?{" "}
              <Link href="/dashboard">
                <span className="text-primary hover:underline cursor-pointer font-medium">Go to Dashboard →</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
