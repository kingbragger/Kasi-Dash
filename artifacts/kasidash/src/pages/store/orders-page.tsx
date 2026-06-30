import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { StoreLayout } from "@/components/store-layout";
import { storeApi, type StoreOrder } from "@/lib/store-api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, CheckCircle, Clock, Truck, XCircle, RotateCcw, ArrowLeft } from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any; color: string }> = {
  pending:    { label: "Pending",    variant: "secondary",   icon: Clock,        color: "text-yellow-600" },
  paid:       { label: "Paid",       variant: "default",     icon: CheckCircle,  color: "text-green-600" },
  processing: { label: "Processing", variant: "default",     icon: Package,      color: "text-blue-600" },
  shipped:    { label: "Shipped",    variant: "default",     icon: Truck,        color: "text-blue-600" },
  delivered:  { label: "Delivered",  variant: "default",     icon: CheckCircle,  color: "text-green-600" },
  fulfilled:  { label: "Fulfilled",  variant: "default",     icon: CheckCircle,  color: "text-green-600" },
  cancelled:  { label: "Cancelled",  variant: "destructive", icon: XCircle,      color: "text-destructive" },
  refunded:   { label: "Refunded",   variant: "outline",     icon: RotateCcw,    color: "text-muted-foreground" },
};

function OrderCard({ order, detailed = false }: { order: StoreOrder; detailed?: boolean }) {
  const sc = statusConfig[order.status] || statusConfig.pending;
  const Icon = sc.icon;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg">{order.orderNumber}</h3>
              <Badge variant={sc.variant} className="text-xs">{sc.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-xl">R{order.total.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{order.itemCount} item{order.itemCount !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Status indicator */}
        <div className={`flex items-center gap-2 text-sm ${sc.color} mb-4`}>
          <Icon className="w-4 h-4" />
          <span>{sc.label}</span>
        </div>

        {/* Items */}
        {order.items && order.items.length > 0 && (
          <div className="space-y-2 mb-4">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground line-clamp-1 flex-1 mr-4">
                  {item.productTitle} <span className="text-xs">×{item.quantity}</span>
                </span>
                <span className="font-medium shrink-0">R{item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Shipping */}
        {detailed && order.shippingAddress && (
          <div className="border-t border-border pt-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Shipping to:</p>
            <p>{order.shippingName}</p>
            <p>{order.shippingAddress}</p>
            <p>{order.shippingCity}, {order.shippingProvince} {order.shippingPostalCode}</p>
          </div>
        )}

        {!detailed && (
          <Link href={`/store/orders/${order.id}`}>
            <Button variant="outline" size="sm">View Details</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export function OrdersList() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const success = new URLSearchParams(window.location.search).get("success");

  useEffect(() => {
    if (!user) return;
    storeApi.getOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <StoreLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Sign in to view your orders</p>
          <Button asChild><Link href="/auth/login">Sign In</Link></Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="max-w-3xl mx-auto">
        {success === "1" && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6 flex items-center gap-3 text-green-600">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium">Order placed successfully! Thank you for your purchase.</p>
          </div>
        )}

        <h1 className="text-2xl font-bold mb-6">My Orders</h1>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
            <Button asChild><Link href="/store">Browse Products</Link></Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(o => <OrderCard key={o.id} order={o} />)}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const orderId = parseInt(id || "0");
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const success = new URLSearchParams(window.location.search).get("success");

  useEffect(() => {
    storeApi.getOrder(orderId)
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [orderId]);

  return (
    <StoreLayout>
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link href="/store/orders"><ArrowLeft className="w-4 h-4 mr-2" /> My Orders</Link>
        </Button>

        {success === "1" && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6 flex items-center gap-3 text-green-600">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium">Order placed successfully! You'll receive a confirmation shortly.</p>
          </div>
        )}

        {loading ? (
          <Skeleton className="h-60 w-full rounded-xl" />
        ) : order ? (
          <OrderCard order={order} detailed />
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Order not found</p>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
