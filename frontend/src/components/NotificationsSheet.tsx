import { useApp } from "@/context/AppContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Bell, CheckCheck, AlertTriangle, Info, CheckCircle2, UserPlus, X, Check } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const typeIcons = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  family: UserPlus,
};

const typeColors = {
  info: "text-primary",
  warning: "text-warning",
  success: "text-success",
  family: "text-blue-500",
};

const NotificationsSheet = () => {
  const { t } = useTranslation();
  const { notifications, markNotificationRead, markAllNotificationsRead, unreadCount, acceptFamilyRequest, declineFamilyRequest } = useApp();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const isFamilyRequest = (notification: { title?: string; type?: string }) => {
    return notification.title === t("notifications.familyRequest") || notification.type === 'family_request';
  };

  const handleAccept = async (id: string, relatedRequestId: number | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!relatedRequestId) {
      console.error('No request ID found');
      return;
    }
    setProcessingId(id);
    try {
      // Сначала помечаем уведомление как прочитанное
      await markNotificationRead(id);
      await acceptFamilyRequest(relatedRequestId);
    } catch (error) {
      console.error('Error accepting request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (id: string, relatedRequestId: number | undefined, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!relatedRequestId) {
      console.error('No request ID found');
      return;
    }
    setProcessingId(id);
    try {
      // Сначала помечаем уведомление как прочитанное
      await markNotificationRead(id);
      await declineFamilyRequest(relatedRequestId);
    } catch (error) {
      console.error('Error declining request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <Bell size={20} className="text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">{t("notifications.title")}</SheetTitle>
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="flex items-center gap-1 text-xs text-primary font-medium"
              >
                <CheckCheck size={14} />
                {t("notifications.markAllRead")}
              </button>
            )}
          </div>
        </SheetHeader>
        <div className="overflow-y-auto max-h-[calc(100vh-80px)]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">{t("notifications.noNotifications")}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => {
                const iconType = isFamilyRequest(n) ? 'family' : n.type;
                const Icon = typeIcons[iconType];
                return (
                  <div
                    key={n.id}
                    className={`relative flex items-start gap-3 p-4 transition-colors hover:bg-secondary/50 ${!n.read ? "bg-primary/5" : ""}`}
                    onClick={() => {
                      // Для family request не помечаем как прочитанное при клике на уведомление
                      // это происходит только при нажатии кнопок Принять/Отклонить
                      if (!isFamilyRequest(n)) {
                        markNotificationRead(n.id);
                      }
                    }}
                  >
                    <div className={`mt-0.5 ${typeColors[iconType]} flex-shrink-0`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{n.date}</p>
                      
                      {isFamilyRequest(n) && !n.read && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAccept(n.id, n.relatedRequestId, e); }}
                            disabled={processingId === n.id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <Check size={14} />
                            {t("notifications.accept")}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDecline(n.id, n.relatedRequestId, e); }}
                            disabled={processingId === n.id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            <X size={14} />
                            {t("notifications.decline")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationsSheet;
