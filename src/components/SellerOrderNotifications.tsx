import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface OrderNotification {
  id: string;
  order_id: string;
  seller_id: string;
  is_read: boolean;
  created_at: string;
  orders?: {
    id: string;
    total: number;
    status: string;
    delivery_info: {
      full_name: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      postal_code: string;
    };
    items: Array<{
      id: string;
      title: string;
      price: number;
      quantity: number;
      seller_id: string;
    }>;
  };
}

interface SellerOrderNotificationsProps {
  sellerId: string;
}

const SellerOrderNotifications = ({ sellerId }: SellerOrderNotificationsProps) => {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();

    // Subscribe to new order notifications
    const channel = supabase
      .channel('order-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_notifications',
          filter: `seller_id=eq.${sellerId}`
        },
        (payload) => {
          loadNotifications();
          
          // Play sleek notification sound
          const audio = new Audio('data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAeMwAUFBQUFCIiIiIiIjAwMDAwPj4+Pj4+TExMTExZWVlZWVlnZ2dnZ3V1dXV1dYODg4ODkZGRkZGRn5+fn5+frKysrKy6urq6urrIyMjIyNbW1tbW1uTk5OTk8vLy8vLy//////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAHjOZTf9/AAAAAAD/+xBkAAP8AAAaQAAAAgAAA0gAAAAAIAAADSAAAACAAADSAAAAATEFNRTMuMTAwAVQAAAAAAAAAABUgJAQtQQAAgAAAHjOZTf9/AAAAAAD/+xBkHgP8AAAaQAAAAgAAA0gAAAAAIAAADSAAAACAAADSAAAAATEFNRTMuMTAwAVQAAAAAAAAAABUgJAQtQQAA');
          audio.volume = 0.4;
          audio.play().catch(err => console.log('Audio play failed:', err));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sellerId]);

  const loadNotifications = async () => {
    const { data, error } = await supabase
      .from('order_notifications')
      .select(`
        *,
        orders (
          id,
          total,
          status,
          delivery_info,
          items
        )
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading order notifications:', error);
      return;
    }

    if (data) {
      setNotifications(data as OrderNotification[]);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('order_notifications')
      .update({ is_read: true })
      .eq('seller_id', sellerId)
      .eq('is_read', false);

    if (error) {
      toast({ title: "Error", description: "Failed to mark notifications as read", variant: "destructive" });
      return;
    }

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const getMyItems = (order: OrderNotification['orders']) => {
    if (!order?.items) return [];
    return order.items.filter(item => item.seller_id === sellerId);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 max-h-96 overflow-y-auto" align="end">
        <div className="space-y-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Order Notifications</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
          </div>
          
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No order notifications yet</p>
          ) : (
            notifications.map((notif) => {
              const myItems = getMyItems(notif.orders);
              const myTotal = myItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
              
              return (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg border ${
                    !notif.is_read ? 'bg-accent border-accent-foreground/20' : 'bg-background'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-sm">New Order</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {notif.orders?.delivery_info && (
                      <div className="text-xs space-y-1 bg-muted p-2 rounded">
                        <p className="font-semibold">Customer Details:</p>
                        <p><strong>Name:</strong> {notif.orders.delivery_info.full_name}</p>
                        <p><strong>Phone:</strong> {notif.orders.delivery_info.phone}</p>
                        <p><strong>Input room number:</strong> {notif.orders.delivery_info.address}</p>
                        <p><strong>City:</strong> {notif.orders.delivery_info.city}, {notif.orders.delivery_info.state}</p>
                        <p><strong>Postal Code:</strong> {notif.orders.delivery_info.postal_code}</p>
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <p className="text-xs font-semibold">Your Items:</p>
                      {myItems.map((item, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground">
                          • {item.title} - ₦{item.price.toLocaleString()} x {item.quantity}
                        </p>
                      ))}
                    </div>
                    
                    <p className="text-sm font-semibold">Your Total: ₦{myTotal.toLocaleString()}</p>
                    <p className="text-xs">
                      <span className={`inline-block px-2 py-1 rounded ${
                        notif.orders?.status === 'approved' ? 'bg-green-100 text-green-800' : 
                        notif.orders?.status === 'pending_admin_approval' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {notif.orders?.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SellerOrderNotifications;
