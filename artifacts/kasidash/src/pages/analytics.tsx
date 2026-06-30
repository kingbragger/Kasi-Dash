import { useState } from "react";
import { useGetRevenueAnalytics, useGetOrderAnalytics, useGetCustomerAnalytics, useGetProductSalesAnalytics, getGetRevenueAnalyticsQueryKey, getGetOrderAnalyticsQueryKey, getGetCustomerAnalyticsQueryKey, getGetProductSalesAnalyticsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpRight, ArrowDownRight, Badge } from "lucide-react";
import { cn } from "@/lib/utils";

type Period = '7d' | '30d' | '90d' | '12m';

export default function Analytics() {
  const [period, setPeriod] = useState<Period>('30d');

  const { data: revenueData, isLoading: loadingRev } = useGetRevenueAnalytics({ period }, { query: { queryKey: getGetRevenueAnalyticsQueryKey({ period }) } });
  const { data: orderData, isLoading: loadingOrd } = useGetOrderAnalytics({ period }, { query: { queryKey: getGetOrderAnalyticsQueryKey({ period }) } });
  const { data: customerData, isLoading: loadingCust } = useGetCustomerAnalytics({ period }, { query: { queryKey: getGetCustomerAnalyticsQueryKey({ period }) } });
  const { data: productSales, isLoading: loadingProd } = useGetProductSalesAnalytics({ query: { queryKey: getGetProductSalesAnalyticsQueryKey() } });

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: "compact", maximumFractionDigits: 1 }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Deep dive into your store's performance metrics.</p>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="30d">Last 30 Days</SelectItem>
            <SelectItem value="90d">Last 90 Days</SelectItem>
            <SelectItem value="12m">Last 12 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <div className="flex items-center justify-between">
              <CardDescription>Total revenue generated over time.</CardDescription>
              {loadingRev ? <Skeleton className="h-6 w-20" /> : (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(revenueData?.totalRevenue || 0)}</span>
                  {revenueData?.growth !== undefined && (
                    <Badge className={revenueData.growth >= 0 ? "bg-green-500/10 text-green-500 hover:bg-green-500/10" : "bg-red-500/10 text-red-500 hover:bg-red-500/10"} variant="secondary">
                      {revenueData.growth >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                      {Math.abs(revenueData.growth)}%
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loadingRev ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData?.dataPoints || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => format(new Date(val), period === '12m' ? "MMM" : "MMM d")}
                      fontSize={12}
                      tickMargin={10}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => formatCurrency(val)}
                      fontSize={12}
                      tickMargin={10}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      labelFormatter={(val) => format(new Date(val), "MMM d, yyyy")}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <div className="flex items-center justify-between">
              <CardDescription>Number of orders placed.</CardDescription>
              {loadingOrd ? <Skeleton className="h-6 w-20" /> : (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{orderData?.totalOrders || 0}</span>
                  {orderData?.growth !== undefined && (
                    <Badge className={orderData.growth >= 0 ? "bg-green-500/10 text-green-500 hover:bg-green-500/10" : "bg-red-500/10 text-red-500 hover:bg-red-500/10"} variant="secondary">
                      {orderData.growth >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                      {Math.abs(orderData.growth)}%
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loadingOrd ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orderData?.dataPoints || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => format(new Date(val), period === '12m' ? "MMM" : "MMM d")}
                      fontSize={12}
                      tickMargin={10}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      fontSize={12}
                      tickMargin={10}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      labelFormatter={(val) => format(new Date(val), "MMM d, yyyy")}
                    />
                    <Bar dataKey="orders" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Growth */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Customer Growth</CardTitle>
            <CardDescription>New customers acquired.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCust ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={customerData?.dataPoints || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCust" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => format(new Date(val), period === '12m' ? "MMM" : "MMM d")}
                      fontSize={12}
                      tickMargin={10}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      fontSize={12}
                      tickMargin={10}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      labelFormatter={(val) => format(new Date(val), "MMM d, yyyy")}
                    />
                    <Area type="monotone" dataKey="newCustomers" stroke="hsl(var(--chart-4))" strokeWidth={2} fillOpacity={1} fill="url(#colorCust)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Sales Breakdown */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle>Product Performance</CardTitle>
            <CardDescription>Top products by revenue.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProd ? (
              <div className="space-y-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Units</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productSales?.slice(0, 5).map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell className="font-medium">{item.productTitle}</TableCell>
                      <TableCell className="text-right">{item.unitsSold}</TableCell>
                      <TableCell className="text-right font-medium">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
