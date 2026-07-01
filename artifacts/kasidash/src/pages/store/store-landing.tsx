import { useState, useEffect } from "react";
import { Link } from "wouter";
import { StoreLayout } from "@/components/store-layout";
import { storeApi, type StoreProduct } from "@/lib/store-api";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ShoppingCart, Tag, Package, Filter, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function ProductCard({ product }: { product: StoreProduct }) {
  const { addItem, loading } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useState("");

  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = "/auth/login";
      return;
    }
    try {
      await addItem(product.id, 1);
      toast({ title: "Added to cart", description: product.title });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  return (
    <Link href={`/store/products/${product.id}`}>
      <div className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-200 cursor-pointer">
        {/* Image */}
        <div className="aspect-square bg-muted relative overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground/40" />
            </div>
          )}
          {discount > 0 && (
            <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
              -{discount}%
            </Badge>
          )}
          {product.inventory === 0 && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <span className="text-sm font-medium text-muted-foreground">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {product.category && (
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3" /> {product.category}
            </p>
          )}
          <h3 className="font-medium text-sm leading-snug line-clamp-2 mb-3 group-hover:text-primary transition-colors">
            {product.title}
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold">R{product.price.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</span>
              {product.compareAtPrice && (
                <span className="text-xs text-muted-foreground line-through ml-2">
                  R{product.compareAtPrice.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>
          </div>

          <div className="mt-3">
            <p className={`text-xs mb-2 ${product.inventory <= 3 ? "text-orange-500" : product.inventory === 0 ? "text-destructive" : "text-muted-foreground"}`}>
              {product.inventory === 0 ? "Out of stock" : product.inventory <= 3 ? `Only ${product.inventory} left` : `${product.inventory} in stock`}
            </p>
            <Button
              size="sm"
              className="w-full"
              disabled={product.inventory === 0 || loading}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {product.inventory === 0 ? "Out of Stock" : "Add to Cart"}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ProductSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}

export default function StoreLanding() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [total, setTotal] = useState(0);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await storeApi.listProducts({
        search: search || undefined,
        category: selectedCategory || undefined,
        limit: 50,
      });
      setProducts(data.products);
      setTotal(data.total);
      if (data.categories.length > 0) setCategories(data.categories);
    } catch (err: any) {
      setError(err.message || "Could not load products. The server may be starting up — please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchProducts, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  return (
    <StoreLayout>
      {/* Hero */}
      <div className="mb-8 text-center py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">KasiDash & BuildForge Tech</h1>
        <p className="text-muted-foreground text-lg">Premium refurbished phones, laptops, and tech at unbeatable prices</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={!selectedCategory ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("")}
            >
              All
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(selectedCategory === cat ? "" : cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-sm text-muted-foreground mb-4">
          {total} product{total !== 1 ? "s" : ""}{search ? ` for "${search}"` : ""}
          {selectedCategory ? ` in ${selectedCategory}` : ""}
        </p>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="col-span-full flex flex-col items-center justify-center py-16 text-center gap-4">
          <AlertCircle className="w-12 h-12 text-destructive/60" />
          <div>
            <p className="font-medium text-destructive mb-1">Could not load products</p>
            <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchProducts}>
            <RefreshCw className="w-4 h-4 mr-2" /> Try again
          </Button>
        </div>
      )}

      {/* Grid */}
      {!error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
            : products.length > 0
            ? products.map(p => <ProductCard key={p.id} product={p} />)
            : (
              <div className="col-span-full text-center py-16">
                <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground">No products found</p>
                {(search || selectedCategory) && (
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setSearch(""); setSelectedCategory(""); }}>
                    Clear filters
                  </Button>
                )}
              </div>
            )}
        </div>
      )}
    </StoreLayout>
  );
}
