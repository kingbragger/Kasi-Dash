import { useState } from "react";
import { useListInventory, useUpdateInventoryItem, getListInventoryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Package, AlertTriangle, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const { data, isLoading } = useListInventory(
    { search: search || undefined, low_stock: lowStockOnly || undefined }, 
    { query: { queryKey: getListInventoryQueryKey({ search: search || undefined, low_stock: lowStockOnly || undefined }) } }
  );
  
  const updateInventory = useUpdateInventoryItem();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleUpdateQuantity = (id: number, quantity: number) => {
    updateInventory.mutate({ id, data: { quantity } }, {
      onSuccess: () => {
        toast({ title: "Inventory updated" });
        queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
      }
    });
  };

  const lowStockCount = data?.items.filter(i => i.isLowStock).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground">Manage your stock levels across all locations.</p>
      </div>

      {lowStockCount > 0 && !isLoading && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <div className="font-medium">
            You have {lowStockCount} items low on stock. Time to reorder.
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-lg border border-border">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search inventory by title or SKU..." 
              className="pl-9 bg-background" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Toggle 
            pressed={lowStockOnly} 
            onPressedChange={setLowStockOnly}
            variant="outline"
            className="data-[state=on]:bg-amber-500/10 data-[state=on]:text-amber-500 data-[state=on]:border-amber-500/20"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Low Stock
          </Toggle>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-md" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No inventory items found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-muted/50">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-muted flex-shrink-0 overflow-hidden border border-border">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.productTitle} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package className="w-4 h-4"/></div>
                          )}
                        </div>
                        <span className="font-medium">{item.productTitle}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {item.sku || '-'}
                    </TableCell>
                    <TableCell>
                      {item.isLowStock ? (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Low Stock</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">In Stock</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.lowStockThreshold}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={item.isLowStock ? "text-amber-500" : ""}>
                        {item.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                        >
                          -1
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        >
                          +1
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
