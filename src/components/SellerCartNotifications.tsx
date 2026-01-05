import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { supabase } from "@/integrations/supabase/client";

interface CartNotification {
  id: string;
  product_id: string;
  product_title: string;
  customer_name: string;
  quantity: number;
  is_read: boolean;
  created_at: string;
}

interface SellerCartNotificationsProps {
  sellerId: string;
}

const SellerCartNotifications = ({ sellerId }: SellerCartNotificationsProps) => {
  const [notifications, setNotifications] = useState<CartNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    
    // Subscribe to real-time notifications
    const channel = supabase
      .channel('cart-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cart_notifications',
          filter: `seller_id=eq.${sellerId}`
        },
        (payload) => {
          const newNotif = payload.new as CartNotification;
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
          
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
      .from('cart_notifications')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading notifications:', error);
      return;
    }

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('cart_notifications')
      .update({ is_read: true })
      .eq('seller_id', sellerId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking as read:', error);
      return;
    }

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Cart Notifications</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No notifications yet
              </p>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  className={`p-3 rounded-lg border ${
                    notif.is_read ? "bg-background" : "bg-accent"
                  }`}
                >
                  <p className="text-sm font-medium">
                    {notif.customer_name} added {notif.product_title} to cart
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Quantity: {notif.quantity} • {new Date(notif.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SellerCartNotifications;
