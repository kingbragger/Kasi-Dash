import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MailCheck, ArrowLeft } from "lucide-react";

async function requestPasswordReset(email: string) {
  const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
  const res = await fetch(`${base}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || "Request failed");
  }
  return res.json();
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/90 via-primary to-primary/70 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <Link href="/store">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="text-white font-bold text-xl">KBT Store</span>
          </div>
        </Link>

        <div className="space-y-4 relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Account recovery<br />made simple.
          </h1>
          <p className="text-white/75 text-lg leading-relaxed">
            Enter your email and we'll send instructions to reset your password.
          </p>
        </div>

        <p className="text-white/40 text-sm">© {new Date().getFullYear()} KasiDash & BuildForge</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center">
            <Link href="/store">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">K</span>
                </div>
                <span className="font-bold text-xl">KBT Store</span>
              </div>
            </Link>
          </div>

          {sent ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                  <MailCheck className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Check your email</h2>
                <p className="mt-2 text-muted-foreground">
                  If an account with <span className="font-medium text-foreground">{email}</span> exists, we've sent password reset instructions.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Didn't receive it? Check your spam folder or{" "}
                <button onClick={() => setSent(false)} className="text-primary hover:underline font-medium">
                  try again
                </button>
                .
              </p>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full h-11">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div>
                <Link href="/auth/login">
                  <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back to Sign In
                  </button>
                </Link>
                <h2 className="text-3xl font-bold tracking-tight">Forgot password?</h2>
                <p className="mt-2 text-muted-foreground">
                  Enter your email and we'll send you reset instructions.
                </p>
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

                <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</> : "Send Reset Instructions"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link href="/auth/login">
                  <span className="text-primary hover:underline cursor-pointer font-semibold">Sign in</span>
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
