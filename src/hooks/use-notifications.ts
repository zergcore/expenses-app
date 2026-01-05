"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead as markAllAction,
  markAsRead as markAction,
  type Notification,
} from "@/actions/notifications";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function useNotifications(
  userId: string | undefined,
  limit: number = 20
) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      const [data, count] = await Promise.all([
        getNotifications(limit),
        getUnreadCount(),
      ]);
      setNotifications(data);
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, limit]);

  // Initial fetch on mount
  useEffect(() => {
    // Avoid synchronous state update warning by deferring slightly or relying on effect natural timing
    // verifying userId prevents unnecessary calls
    if (userId) {
      fetchNotifications();
    }
  }, [fetchNotifications, userId]);

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          toast.info(newNotification.title, {
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAsRead = async (id: string) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await markAction(id);
    } catch {
      // Revert on failure would go here, but for simple read status simple toast is enough
      toast.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);

      await markAllAction();
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
