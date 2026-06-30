import { useGetDashboardSummary, useGetRevenueChart, useGetTopProducts, useGetRecentOrders, getGetDashboardSummaryQueryKey, getGetRevenueChartQueryKey, getGetTopProductsQueryKey, getGetRecentOrdersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, DollarSign, ShoppingCart, Package, Users } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: chartData, isLoading: loadingChart } = useGetRevenueChart({ query: { queryKey: getGetRevenueChartQueryKey() } });
  const { data: topProducts, isLoading: loadingProducts } = useGetTopProducts({ query: { queryKey: getGetTopProductsQueryKey() } });
  const { data: recentOrders, isLoading: loadingOrders } = useGetRecentOrders({ query: { queryKey: getGetRecentOrdersQueryKey() } });

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your store's performance today.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Total Revenue" 
          value={summary?.todayRevenue ? formatCurrency(summary.todayRevenue) : "$0.00"} 
          growth={summary?.revenueGrowth} 
          icon={DollarSign} 
          loading={loadingSummary} 
        />
        <MetricCard 
          title="Orders" 
          value={summary?.todayOrders?.toString() || "0"} 
          growth={summary?.ordersGrowth} 
          icon={ShoppingCart} 
          loading={loadingSummary} 
        />
        <MetricCard 
          title="Total Customers" 
          value={summary?.totalCustomers?.toString() || "0"} 
          growth={summary?.customersGrowth} 
          icon={Users} 
          loading={loadingSummary} 
        />
        <MetricCard 
          title="Avg. Order Value" 
          value={summary?.averageOrderValue ? formatCurrency(summary.averageOrderValue) : "$0.00"} 
          icon={Package} 
          loading={loadingSummary} 
        />
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {/* Main Chart */}
        <Card className="md:col-span-4 lg:col-span-5">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Daily revenue for the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingChart ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => format(new Date(val), "MMM d")}
                      fontSize={12}
                      tickMargin={10}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => `$${val}`}
                      fontSize={12}
                      tickMargin={10}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      labelFormatter={(val) => format(new Date(val), "MMM d, yyyy")}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="md:col-span-3 lg:col-span-2">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best selling items this month.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <div className="space-y-4">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {topProducts?.map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-muted flex-shrink-0 overflow-hidden">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package className="w-4 h-4"/></div>
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium leading-none truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{product.unitsSold} units</p>
                      </div>
                    </div>
                    <div className="font-medium text-sm">
                      {formatCurrency(product.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Latest transactions across your store.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingOrders ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders?.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/50 cursor-pointer">
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{order.customerName}</span>
                        <span className="text-xs text-muted-foreground">{order.customerEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(order.createdAt), "MMM d, h:mm a")}
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
                    <TableCell className="text-right font-medium">
                      {formatCurrency(order.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, growth, icon: Icon, loading }: { title: string, value: string, growth?: number, icon: any, loading: boolean }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {growth !== undefined && (
              <p className="text-xs mt-1 flex items-center gap-1">
                <span className={cn("flex items-center font-medium", growth >= 0 ? "text-green-500" : "text-red-500")}>
                  {growth >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                  {Math.abs(growth)}%
                </span>
                <span className="text-muted-foreground">from last month</span>
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
