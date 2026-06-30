import { useRoute, useParams } from "wouter";
import { useGetCustomer, getGetCustomerQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Mail, MapPin, Calendar, ShoppingBag, CreditCard, Star } from "lucide-react";
import { Link } from "wouter";

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const customerId = parseInt(id || "0", 10);
  
  const { data, isLoading } = useGetCustomer(customerId, { 
    query: { 
      queryKey: getGetCustomerQueryKey(customerId),
      enabled: !!customerId 
    } 
  });

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-[300px] md:col-span-1" />
          <Skeleton className="h-[300px] md:col-span-2" />
        </div>
      </div>
    );
  }

  if (!data?.customer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Customer not found</h2>
        <p className="text-muted-foreground mt-2">The customer you're looking for doesn't exist.</p>
        <Link href="/customers">
          <Button className="mt-4">Back to Customers</Button>
        </Link>
      </div>
    );
  }

  const { customer, orders } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
          <p className="text-muted-foreground">Customer Profile & History</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Customer Profile Sidebar */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{customer.name}</h3>
                <Badge variant={customer.isRepeat ? "default" : "secondary"} className={customer.isRepeat ? "bg-purple-500 hover:bg-purple-600 text-white" : ""}>
                  {customer.isRepeat ? "Repeat Customer" : "New Customer"}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{customer.location || 'No location provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Customer since {format(new Date(customer.createdAt), "MMM d, yyyy")}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1"><ShoppingBag className="w-3 h-3" /> Orders</p>
                <p className="text-xl font-bold">{customer.totalOrders}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1"><CreditCard className="w-3 h-3" /> Spent</p>
                <p className="text-xl font-bold">{formatCurrency(customer.totalSpent)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1"><Star className="w-3 h-3" /> Lifetime Value</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(customer.lifetimeValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order History */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Order History</CardTitle>
            <CardDescription>All previous orders from this customer.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Order</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="pr-6 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No orders found for this customer.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders?.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50 cursor-pointer">
                      <TableCell className="pl-6 font-medium font-mono">
                        <Link href={`/orders?search=${order.orderNumber}`}>
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{format(new Date(order.createdAt), "MMM d, yyyy")}</TableCell>
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
                      <TableCell className="pr-6 text-right font-medium">{formatCurrency(order.total)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
