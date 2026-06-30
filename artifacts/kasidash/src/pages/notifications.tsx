import { useListNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, ShoppingCart, AlertTriangle, CreditCard, TrendingUp, RefreshCw, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Notifications() {
  const { data: notifications, isLoading } = useListNotifications({ query: { queryKey: getListNotificationsQueryKey() } });
  
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleMarkRead = (id: number) => {
    markRead.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      }
    });
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "All notifications marked as read" });
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      }
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_order': return <ShoppingCart className="w-5 h-5 text-blue-500" />;
      case 'low_inventory': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'failed_payment': return <CreditCard className="w-5 h-5 text-red-500" />;
      case 'high_sales': return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'app_update': return <RefreshCw className="w-5 h-5 text-purple-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'new_order': return 'bg-blue-500/10';
      case 'low_inventory': return 'bg-amber-500/10';
      case 'failed_payment': return 'bg-red-500/10';
      case 'high_sales': return 'bg-green-500/10';
      case 'app_update': return 'bg-purple-500/10';
      default: return 'bg-gray-500/10';
    }
  };

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Stay updated on your store's activity.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead} disabled={markAllRead.isPending}>
            <CheckCircle2 className="w-4 h-4 mr-2" /> Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex gap-4">
                <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))
          ) : notifications?.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <Bell className="w-12 h-12 mb-4 opacity-20" />
              <p>You're all caught up!</p>
              <p className="text-sm">No new notifications.</p>
            </div>
          ) : (
            notifications?.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 flex gap-4 transition-colors hover:bg-muted/30 ${!notification.isRead ? 'bg-primary/5' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getBgColor(notification.type)}`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className={`font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                  
                  {!notification.isRead && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 h-8 px-2 text-xs"
                      onClick={() => handleMarkRead(notification.id)}
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
                {!notification.isRead && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
