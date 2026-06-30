import { useState } from "react";
import { useLocation, Link } from "wouter";
import { StoreLayout } from "@/components/store-layout";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { checkoutApi, type CheckoutData } from "@/lib/store-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Package, Loader2, CreditCard, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CheckoutPage() {
  const { cart, refresh } = useCart();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"ozow" | "cod">("ozow");

  const [form, setForm] = useState<CheckoutData>({
    name: user?.name || "",
    address: user?.address || "",
    city: user?.city || "",
    province: user?.province || "",
    postalCode: user?.postalCode || "",
    phone: user?.phone || "",
    notes: "",
    paymentMethod: "ozow",
  });

  const set = (k: keyof CheckoutData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await checkoutApi.place({ ...form, paymentMethod });

      if (paymentMethod === "ozow") {
        const payment = await checkoutApi.initiateOzow(result.paymentId);
        if (payment.mode === "test") {
          const confirm = await checkoutApi.testConfirm(result.paymentId);
          await refresh();
          setLocation(`/store/orders/${result.orderId}?success=1`);
        } else {
          window.location.href = payment.redirectUrl;
        }
      } else {
        await refresh();
        setLocation(`/store/orders/${result.orderId}?success=1`);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Checkout failed", description: err.message });
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <StoreLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Please sign in to checkout</p>
          <Button asChild><Link href="/auth/login">Sign In</Link></Button>
        </div>
      </StoreLayout>
    );
  }

  if (cart.items.length === 0) {
    return (
      <StoreLayout>
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <Button asChild><Link href="/store">Browse Products</Link></Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5" /> Shipping Details
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" value={form.name} onChange={set("name")} required placeholder="Sipho Dlamini" />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="address">Street Address *</Label>
                    <Input id="address" value={form.address} onChange={set("address")} required placeholder="123 Main Street, Sandton" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" value={form.city} onChange={set("city")} required placeholder="Johannesburg" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province">Province *</Label>
                    <Input id="province" value={form.province} onChange={set("province")} required placeholder="Gauteng" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input id="postalCode" value={form.postalCode} onChange={set("postalCode")} required placeholder="2196" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" type="tel" value={form.phone} onChange={set("phone")} required placeholder="+27 71 234 5678" />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="notes">Order Notes (optional)</Label>
                    <Textarea id="notes" value={form.notes} onChange={set("notes")} placeholder="Any special instructions..." rows={2} />
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" /> Payment Method
                </h2>
                <div className="space-y-3">
                  <label className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${paymentMethod === "ozow" ? "border-primary bg-primary/5" : "border-border hover:bg-accent"}`}>
                    <input type="radio" name="payment" value="ozow" checked={paymentMethod === "ozow"} onChange={() => setPaymentMethod("ozow")} className="sr-only" />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "ozow" ? "border-primary" : "border-muted-foreground"}`}>
                      {paymentMethod === "ozow" && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <p className="font-medium">Ozow (Instant EFT)</p>
                      <p className="text-xs text-muted-foreground">Secure online banking payment — no card needed</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-border hover:bg-accent"}`}>
                    <input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} className="sr-only" />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "cod" ? "border-primary" : "border-muted-foreground"}`}>
                      {paymentMethod === "cod" && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <p className="font-medium">Cash on Delivery</p>
                      <p className="text-xs text-muted-foreground">Pay when your order arrives</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
                <h2 className="font-semibold text-lg mb-4">Order Summary</h2>

                <div className="space-y-2 text-sm mb-4 max-h-48 overflow-y-auto">
                  {cart.items.map(item => (
                    <div key={item.id} className="flex justify-between gap-2">
                      <span className="text-muted-foreground flex-1 min-w-0">
                        <span className="line-clamp-1">{item.product.title}</span>
                        <span className="text-xs">×{item.quantity}</span>
                      </span>
                      <span className="shrink-0">R{item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 mb-6">
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>Subtotal</span>
                    <span>R{cart.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Shipping</span>
                    <span className={cart.total >= 500 ? "text-green-600" : ""}>
                      {cart.total >= 500 ? "FREE" : "R99.00"}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t border-border pt-2 mt-2">
                    <span>Total</span>
                    <span>R{(cart.total + (cart.total >= 500 ? 0 : 99)).toFixed(2)}</span>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</> : `Place Order — R${(cart.total + (cart.total >= 500 ? 0 : 99)).toFixed(2)}`}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </StoreLayout>
  );
}
