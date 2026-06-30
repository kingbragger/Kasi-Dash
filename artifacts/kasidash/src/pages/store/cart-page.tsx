import { Link, useLocation } from "wouter";
import { StoreLayout } from "@/components/store-layout";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package } from "lucide-react";

export default function CartPage() {
  const { cart, updateItem, removeItem, loading } = useCart();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    return (
      <StoreLayout>
        <div className="text-center py-20">
          <ShoppingCart className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sign in to view your cart</h2>
          <p className="text-muted-foreground mb-6">Create an account or sign in to start shopping</p>
          <div className="flex justify-center gap-3">
            <Button asChild><Link href="/auth/login">Sign In</Link></Button>
            <Button variant="outline" asChild><Link href="/auth/register">Create Account</Link></Button>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (cart.items.length === 0) {
    return (
      <StoreLayout>
        <div className="text-center py-20">
          <ShoppingCart className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Start adding products to your cart</p>
          <Button asChild><Link href="/store">Browse Products</Link></Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Shopping Cart ({cart.itemCount} item{cart.itemCount !== 1 ? "s" : ""})</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map(item => (
              <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex gap-4">
                {/* Image */}
                <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                  {item.product.imageUrl ? (
                    <img src={item.product.imageUrl} alt={item.product.title} className="w-full h-full object-contain p-1" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/store/products/${item.product.id}`}>
                    <h3 className="font-medium text-sm leading-snug line-clamp-2 hover:text-primary cursor-pointer transition-colors">
                      {item.product.title}
                    </h3>
                  </Link>
                  {item.product.sku && <p className="text-xs text-muted-foreground mt-0.5">SKU: {item.product.sku}</p>}
                  <p className="text-sm font-semibold mt-1">R{item.product.price.toFixed(2)}</p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateItem(item.id, item.quantity - 1)}
                        disabled={loading}
                        className="px-2.5 py-1.5 hover:bg-accent transition-colors disabled:opacity-50"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 py-1.5 text-sm font-medium min-w-[2.5rem] text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        disabled={loading || item.quantity >= item.product.inventory}
                        className="px-2.5 py-1.5 hover:bg-accent transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold">R{item.subtotal.toFixed(2)}</span>
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={loading}
                        className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
              <h2 className="font-semibold text-lg mb-4">Order Summary</h2>

              <div className="space-y-2 text-sm mb-4">
                {cart.items.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-muted-foreground line-clamp-1 flex-1 mr-2">
                      {item.product.title.substring(0, 30)}{item.product.title.length > 30 ? "…" : ""} ×{item.quantity}
                    </span>
                    <span>R{item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 mb-6">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>R{cart.total.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">VAT included where applicable</p>
              </div>

              <Button className="w-full" size="lg" onClick={() => setLocation("/store/checkout")}>
                Proceed to Checkout <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <Button variant="ghost" size="sm" className="w-full mt-3" asChild>
                <Link href="/store">← Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
