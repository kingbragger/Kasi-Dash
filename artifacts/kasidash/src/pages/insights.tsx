import { useGetInsights, getGetInsightsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, TrendingUp, Megaphone, Users, Sparkles, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function Insights() {
  const { data: insights, isLoading } = useGetInsights({ query: { queryKey: getGetInsightsQueryKey() } });

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-primary" />
            AI Insights
          </h1>
          <p className="text-muted-foreground">Actionable intelligence for your business.</p>
        </div>
        {!isLoading && insights && (
          <p className="text-sm text-muted-foreground">
            Generated {format(new Date(insights.generatedAt), "MMM d, h:mm a")}
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Estimated Revenue */}
        <Card className="md:col-span-2 lg:col-span-3 bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary">Estimated Monthly Revenue</h3>
                <p className="text-muted-foreground">Based on current trajectory and historical data</p>
              </div>
            </div>
            <div className="text-right">
              {isLoading ? (
                <Skeleton className="h-10 w-32 ml-auto" />
              ) : (
                <div className="text-4xl font-bold tracking-tight text-primary">
                  {formatCurrency(insights?.estimatedMonthlyRevenue || 0)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Warnings */}
        <InsightCard 
          title="Inventory Risks" 
          icon={AlertTriangle} 
          iconColor="text-amber-500" 
          bgColor="bg-amber-500/10"
          items={insights?.lowStockWarnings} 
          loading={isLoading}
          actionLabel="View Inventory"
          actionHref="/inventory"
        />

        {/* Best Sellers */}
        <InsightCard 
          title="Growth Drivers" 
          icon={TrendingUp} 
          iconColor="text-green-500" 
          bgColor="bg-green-500/10"
          items={insights?.bestSellers} 
          loading={isLoading}
          actionLabel="View Products"
          actionHref="/products"
        />

        {/* Needs Promotion */}
        <InsightCard 
          title="Needs Promotion" 
          icon={Megaphone} 
          iconColor="text-blue-500" 
          bgColor="bg-blue-500/10"
          items={insights?.needsPromotion} 
          loading={isLoading}
          actionLabel="Create Campaign"
        />

        {/* Customer Trends */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-500" />
              </div>
              Customer Behavior
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            ) : (
              <ul className="space-y-3">
                {insights?.customerTrends?.map((trend, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                    <span className="leading-relaxed">{trend}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Marketing Recommendations */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              Strategic Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {insights?.marketingRecommendations?.map((rec, i) => (
                  <div key={i} className="p-4 rounded-lg bg-muted/50 border border-border">
                    <p className="text-sm font-medium leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InsightCard({ title, icon: Icon, iconColor, bgColor, items, loading, actionLabel, actionHref }: any) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className={`w-8 h-8 rounded-full ${bgColor} flex items-center justify-center`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {loading ? (
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ) : (
          <ul className="space-y-3 flex-1 mb-6">
            {items?.length > 0 ? items.map((item: string, i: number) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${iconColor.replace('text-', 'bg-')} flex-shrink-0`} />
                <span className="leading-relaxed">{item}</span>
              </li>
            )) : (
              <li className="text-sm text-muted-foreground italic">No insights available right now.</li>
            )}
          </ul>
        )}
        {actionLabel && !loading && items?.length > 0 && (
          <Button variant="outline" className="w-full mt-auto" asChild={!!actionHref}>
            {actionHref ? <a href={actionHref}>{actionLabel}</a> : <span>{actionLabel}</span>}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
