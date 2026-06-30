import { useState } from "react";
import { Link } from "wouter";
import { StoreLayout } from "@/components/store-layout";
import { useAuth } from "@/contexts/auth-context";
import { authApi } from "@/lib/store-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Package, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AccountPage() {
  const { user, updateUser, loading } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    province: user?.province || "",
    postalCode: user?.postalCode || "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const updated = await authApi.updateProfile(form);
      updateUser({ ...user!, ...updated });
      setSaved(true);
      toast({ title: "Profile updated", description: "Your details have been saved." });
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <StoreLayout><div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div></StoreLayout>;

  if (!user) {
    return (
      <StoreLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Sign in to view your account</p>
          <Button asChild><Link href="/auth/login">Sign In</Link></Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">My Account</h1>

        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-4 h-4" /> Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Email address</Label>
                    <Input value={user.email} disabled className="opacity-60" />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={form.name} onChange={set("name")} required />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" value={form.phone} onChange={set("phone")} placeholder="+27 71 234 5678" />
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-4">
                  <p className="text-sm font-medium">Default Shipping Address</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-2">
                      <Label htmlFor="address">Street Address</Label>
                      <Input id="address" value={form.address} onChange={set("address")} placeholder="123 Main St" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" value={form.city} onChange={set("city")} placeholder="Johannesburg" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="province">Province</Label>
                      <Input id="province" value={form.province} onChange={set("province")} placeholder="Gauteng" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input id="postalCode" value={form.postalCode} onChange={set("postalCode")} placeholder="2196" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={saving}>
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save Changes"}
                  </Button>
                  {saved && (
                    <div className="flex items-center gap-1.5 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" /> Saved!
                    </div>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Quick links */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">My Orders</p>
                    <p className="text-xs text-muted-foreground">View and track your orders</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/store/orders">View Orders</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StoreLayout>
  );
}
