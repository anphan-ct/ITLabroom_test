import { useState, useEffect, useCallback, useRef } from "react";
import {
  getNotificationsFromApi,
  getUnreadNotificationCountFromApi,
  markNotificationAsReadFromApi,
  markAllNotificationsAsReadFromApi,
} from "../services/notification.service";

export function useNotifications({ panelOpen = false, currentTab = "all" } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const isMountedRef = useRef(true);
  const panelStateRef = useRef({ panelOpen, currentTab });
  const prevUnreadCountRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    panelStateRef.current = { panelOpen, currentTab };
  }, [panelOpen, currentTab]);

  useEffect(() => {
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  const fetchNotifications = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await getNotificationsFromApi(params);
      if (isMountedRef.current && response?.data) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      if (isMountedRef.current) setNotifications([]);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  // Polling unread count
  useEffect(() => {
    let isMounted = true;

    const fetchUnreadCount = async () => {
      try {
        const response = await getUnreadNotificationCountFromApi();
        if (isMounted && response?.data) {
          const newCount = response.data.unread_count || 0;

          if (newCount > prevUnreadCountRef.current) {
            const { panelOpen: currentPanelOpen, currentTab: currentPanelTab } = panelStateRef.current;
            if (currentPanelOpen) {
              const params = currentPanelTab === "unread" ? { status: "unread" } : {};
              fetchNotifications(params);
            }
          }

          setUnreadCount(newCount);
        }
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 20000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    const prevNotifications = [...notifications];
    const prevUnreadCount = unreadCount;

    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, da_doc: true } : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationAsReadFromApi(id);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      setNotifications(prevNotifications);
      setUnreadCount(prevUnreadCount);
    }
  };

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;

    const prevNotifications = [...notifications];
    const prevUnreadCount = unreadCount;

    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, da_doc: true }))
    );
    setUnreadCount(0);

    try {
      await markAllNotificationsAsReadFromApi();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      setNotifications(prevNotifications);
      setUnreadCount(prevUnreadCount);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
