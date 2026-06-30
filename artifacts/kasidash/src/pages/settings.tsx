import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/theme-provider";
import { Loader2 } from "lucide-react";
import type { MerchantSettingsUpdateTheme } from "@workspace/api-client-react";

export default function Settings() {
  const { data: settings, isLoading } = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() } });
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setTheme } = useTheme();

  const [formData, setFormData] = useState({
    businessName: "",
    currency: "USD",
    timezone: "UTC",
    theme: "system" as MerchantSettingsUpdateTheme,
    notifyNewOrders: true,
    notifyLowInventory: true,
    notifyFailedPayments: true,
    lowStockThreshold: 10
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        businessName: settings.businessName,
        currency: settings.currency,
        timezone: settings.timezone,
        theme: settings.theme,
        notifyNewOrders: settings.notifyNewOrders,
        notifyLowInventory: settings.notifyLowInventory,
        notifyFailedPayments: settings.notifyFailedPayments,
        lowStockThreshold: settings.lowStockThreshold
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate({ data: formData }, {
      onSuccess: (data) => {
        toast({ title: "Settings saved successfully" });
        queryClient.setQueryData(getGetSettingsQueryKey(), data);
        if (data.theme) {
          setTheme(data.theme);
        }
      },
      onError: () => {
        toast({ title: "Failed to save settings", variant: "destructive" });
      }
    });
  };

  const handleThemeChange = (val: string) => {
    const themeVal = val as MerchantSettingsUpdateTheme;
    setFormData({ ...formData, theme: themeVal });
    setTheme(themeVal); // Apply immediately for preview
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your store preferences and account settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>Basic details about your business.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input 
              id="businessName" 
              value={formData.businessName} 
              onChange={e => setFormData({...formData, businessName: e.target.value})} 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={formData.currency} onValueChange={v => setFormData({...formData, currency: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="CAD">CAD (£)</SelectItem>
                  <SelectItem value="AUD">AUD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={formData.timezone} onValueChange={v => setFormData({...formData, timezone: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how KasiDash looks on your device.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={formData.theme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System Default</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications & Alerts</CardTitle>
          <CardDescription>Configure what events you want to be notified about.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New Orders</Label>
              <p className="text-sm text-muted-foreground">Receive a notification when a new order is placed.</p>
            </div>
            <Switch 
              checked={formData.notifyNewOrders} 
              onCheckedChange={c => setFormData({...formData, notifyNewOrders: c})} 
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Failed Payments</Label>
              <p className="text-sm text-muted-foreground">Get alerted when a customer payment fails.</p>
            </div>
            <Switch 
              checked={formData.notifyFailedPayments} 
              onCheckedChange={c => setFormData({...formData, notifyFailedPayments: c})} 
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Low Inventory Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified when products drop below their threshold.</p>
            </div>
            <Switch 
              checked={formData.notifyLowInventory} 
              onCheckedChange={c => setFormData({...formData, notifyLowInventory: c})} 
            />
          </div>

          {formData.notifyLowInventory && (
            <div className="space-y-2 pt-2">
              <Label htmlFor="lowStockThreshold">Global Low Stock Threshold</Label>
              <Input 
                id="lowStockThreshold" 
                type="number" 
                className="w-32"
                value={formData.lowStockThreshold} 
                onChange={e => setFormData({...formData, lowStockThreshold: parseInt(e.target.value) || 0})} 
              />
              <p className="text-xs text-muted-foreground">Default threshold if not set on the specific product.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t border-border px-6 py-4">
          <Button onClick={handleSave} disabled={updateSettings.isPending} className="ml-auto">
            {updateSettings.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
