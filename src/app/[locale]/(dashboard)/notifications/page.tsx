import { NotificationsList } from "@/components/notifications/notifications-list";
import { requireUser } from "@/lib/auth/server";

export default async function NotificationsPage() {
  const user = await requireUser();

  return <NotificationsList userId={user.id} />;
}
