import { useState } from "react";
import { useListOrders, useFulfilOrder, useCancelOrder, getListOrdersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Filter, MoreHorizontal, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState<any>(undefined);
  const { data, isLoading } = useListOrders({ status: statusFilter }, { query: { queryKey: getListOrdersQueryKey({ status: statusFilter }) } });
  
  const fulfilOrder = useFulfilOrder();
  const cancelOrder = useCancelOrder();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFulfil = (id: number) => {
    fulfilOrder.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Order fulfilled" });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      }
    });
  };

  const handleCancel = (id: number) => {
    cancelOrder.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Order cancelled", variant: "destructive" });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      }
    });
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage and track all customer orders.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search orders..." className="pl-9 bg-background" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {statusFilter ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) : "All Statuses"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter(undefined)}>All Statuses</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pending</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('paid')}>Paid</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('fulfilled')}>Fulfilled</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('cancelled')}>Cancelled</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="pr-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data?.orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                data?.orders.map((order) => (
                  <TableRow key={order.id} className="group">
                    <TableCell className="pl-6 font-medium font-mono">{order.orderNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(order.createdAt), "MMM d, yyyy")}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{order.customerName}</span>
                        <span className="text-xs text-muted-foreground">{order.customerEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        order.status === 'paid' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        order.status === 'fulfilled' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        order.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        order.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        'bg-gray-500/10 text-gray-500 border-gray-500/20'
                      }>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.itemCount} items</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(order.total)}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleFulfil(order.id)}
                            disabled={order.status === 'fulfilled' || order.status === 'cancelled'}
                          >
                            <Check className="w-4 h-4 mr-2" /> Mark Fulfilled
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleCancel(order.id)}
                            disabled={order.status === 'cancelled' || order.status === 'fulfilled'}
                            className="text-destructive focus:text-destructive"
                          >
                            <X className="w-4 h-4 mr-2" /> Cancel Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
