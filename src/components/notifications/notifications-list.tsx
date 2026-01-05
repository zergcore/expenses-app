"use client";

import { useNotifications } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCheck, Bell } from "lucide-react";

interface NotificationsListProps {
  userId: string;
}

export function NotificationsList({ userId }: NotificationsListProps) {
  const { notifications, isLoading, markAsRead, markAllAsRead } =
    useNotifications(userId, 50); // Fetch more (50) for the full page

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
        <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark all read
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {/* Skeleton loader */}
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
                    onClick={() => markAsRead(notification.id)}
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
