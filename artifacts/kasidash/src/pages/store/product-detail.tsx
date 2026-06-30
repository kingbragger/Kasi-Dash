import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { StoreLayout } from "@/components/store-layout";
import { storeApi, type StoreProduct } from "@/lib/store-api";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, ArrowLeft, Package, CheckCircle, Minus, Plus, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id || "0");
  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const { addItem } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    storeApi.getProduct(productId)
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [productId]);

  const discount = product?.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0;

  const handleAddToCart = async () => {
    if (!user) { setLocation("/auth/login"); return; }
    setAdding(true);
    try {
      await addItem(productId, quantity);
      toast({ title: "Added to cart!", description: `${quantity}× ${product!.title}` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) { setLocation("/auth/login"); return; }
    setAdding(true);
    try {
      await addItem(productId, quantity);
      setLocation("/store/checkout");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <StoreLayout>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (!product) {
    return (
      <StoreLayout>
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Product not found</h2>
          <Button variant="ghost" asChild><Link href="/store">← Back to store</Link></Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" size="sm" className="mb-6" asChild>
          <Link href="/store"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Store</Link>
        </Button>

        <div className="grid md:grid-cols-2 gap-10">
          {/* Image */}
          <div className="aspect-square rounded-xl bg-muted overflow-hidden relative">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.title} className="w-full h-full object-contain p-4" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-20 h-20 text-muted-foreground/30" />
              </div>
            )}
            {discount > 0 && (
              <Badge className="absolute top-4 left-4 bg-destructive text-destructive-foreground text-sm px-2.5 py-1">
                -{discount}% OFF
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            {product.category && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                <Tag className="w-3.5 h-3.5" /> {product.category}
              </div>
            )}

            <h1 className="text-2xl font-bold leading-snug mb-4">{product.title}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-primary">
                R{product.price.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
              </span>
              {product.compareAtPrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    R{product.compareAtPrice.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                  </span>
                  <Badge variant="secondary" className="text-green-600">Save {discount}%</Badge>
                </>
              )}
            </div>

            {/* Stock */}
            <div className={`flex items-center gap-2 text-sm mb-6 ${
              product.inventory === 0 ? "text-destructive" :
              product.inventory <= 3 ? "text-orange-500" : "text-green-600"
            }`}>
              <CheckCircle className="w-4 h-4" />
              {product.inventory === 0 ? "Out of stock" :
               product.inventory <= 3 ? `Only ${product.inventory} left in stock!` :
               `In stock (${product.inventory} available)`}
            </div>

            {/* SKU */}
            {product.sku && (
              <p className="text-xs text-muted-foreground mb-4">SKU: {product.sku}</p>
            )}

            {/* Quantity */}
            {product.inventory > 0 && (
              <div className="flex items-center gap-3 mb-6">
                <span className="text-sm font-medium">Quantity:</span>
                <div className="flex items-center border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="px-3 py-2 hover:bg-accent transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 font-medium min-w-[3rem] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(product.inventory, q + 1))}
                    className="px-3 py-2 hover:bg-accent transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full"
                disabled={product.inventory === 0 || adding}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {product.inventory === 0 ? "Out of Stock" : "Add to Cart"}
              </Button>
              {product.inventory > 0 && (
                <Button size="lg" variant="outline" className="w-full" disabled={adding} onClick={handleBuyNow}>
                  Buy Now
                </Button>
              )}
            </div>

            {/* Perks */}
            <div className="mt-8 space-y-3 border-t border-border pt-6">
              {["Free delivery on orders over R500", "12-month warranty included", "Secure payment via Ozow"].map(perk => (
                <div key={perk} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  {perk}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="mt-12 border-t border-border pt-8">
            <h2 className="text-lg font-semibold mb-4">Product Description</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {product.description}
            </div>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
