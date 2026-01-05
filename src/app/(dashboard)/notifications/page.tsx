"use client";

import { useEffect, useState } from "react";
import {
  getNotifications,
  markAllAsRead,
  markAsRead,
  type Notification,
} from "@/actions/notifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCheck, Bell } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await getNotifications(50); // Fetch more for page
      setNotifications(data);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Realtime subscription for list
    const supabase = createClient();
    const channel = supabase
      .channel("page-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Notifications
          </h1>
          <p className="text-muted-foreground">
            Stay updated with your budget alerts and system messages.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark all read
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {/* Skeleton loader could go here */}
          <div className="h-24 w-full bg-muted/20 animate-pulse rounded-lg" />
          <div className="h-24 w-full bg-muted/20 animate-pulse rounded-lg" />
          <div className="h-24 w-full bg-muted/20 animate-pulse rounded-lg" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <Bell className="mb-4 h-12 w-12 opacity-20" />
          <p className="text-lg font-medium">No notifications</p>
          <p className="text-sm">You are all caught up!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                "transition-all hover:bg-muted/50",
                !notification.is_read && "border-l-4 border-l-primary"
              )}
            >
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4
                      className={cn(
                        "font-medium",
                        !notification.is_read && "text-primary"
                      )}
                    >
                      {notification.title}
                    </h4>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                </div>
                {!notification.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    Mark read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
