import {
  AlertTriangle,
  Bell,
  XCircle,
  CheckCircle2,
  LogOut,
  Wrench,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../../hooks/useNotifications";

const notificationTypes = {
  new: {
    icon: AlertTriangle,
    className: "bg-rose-100 text-rose-600",
  },
  processing: {
    icon: Wrench,
    className: "bg-amber-100 text-amber-600",
  },
  resolved: {
    icon: CheckCircle2,
    className: "bg-emerald-100 text-emerald-600",
  },
  rejected: {
    icon: XCircle,
    className: "bg-slate-100 text-slate-600",
  },
};

const defaultConfig = {
  icon: Bell,
  className: "bg-blue-100 text-blue-600",
};

function NotificationItem({ notification, onMarkAsRead }) {
  const config = notificationTypes[notification.loai_thong_bao] || defaultConfig;
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={() => {
        if (!notification.da_doc) {
          onMarkAsRead(notification.id);
        }
      }}
      className="grid w-full grid-cols-[44px_minmax(0,1fr)_12px] gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-slate-100"
    >
      <span className={`flex h-11 w-11 items-center justify-center rounded-full ${config.className}`}>
        <Icon size={20} />
      </span>

      <span className="min-w-0">
        <span className="block text-sm font-bold text-slate-900">
          {notification.tieu_de}
        </span>
        <span className="mt-1 line-clamp-2 block text-sm leading-5 text-slate-600">
          {notification.noi_dung}
        </span>
        <span className="mt-1 block text-xs font-bold text-[#193D87]">
          {notification.created_at}
        </span>
      </span>

      <span className="flex items-center justify-center">
        {!notification.da_doc ? (
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
        ) : null}
      </span>
    </button>
  );
}

export default function Header({
  onMenuToggle,
  onLogout,
  currentUser,
  roleLabel,
  showMenuButton = true,
  showLogout = false,
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationTab, setNotificationTab] = useState("all");
  const accountRef = useRef(null);
  const notificationRef = useRef(null);

  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  useEffect(() => {
    if (!notificationOpen) return;
    const params = notificationTab === "unread" ? { status: "unread" } : {};
    fetchNotifications(params);
  }, [notificationOpen, notificationTab, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setAccountOpen(false);
    onLogout?.();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#193D87] bg-[#193D87] text-white shadow-sm">
      {showMenuButton && (
        <button
          onClick={onMenuToggle}
          className="absolute right-3 top-4 z-10 rounded-lg border border-white/30 bg-white/10 p-2 text-white shadow-sm hover:bg-white/20 md:hidden"
          type="button"
          aria-label="Mở tài khoản"
          title="Tài khoản"
        >
          <UserRound size={20} />
        </button>
      )}

      <div
        className={`flex min-h-[72px] items-center gap-4 px-4 sm:px-6 md:pl-6 ${
          showMenuButton ? "pr-14 md:pr-0" : ""
        }`}
      >
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <img
            src="/img/logo.png"
            alt="Logo Cao Thắng"
            className="h-12 w-12 shrink-0 object-contain"
          />
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-sm font-bold uppercase text-white sm:text-base">
              Trường CĐ Kỹ thuật Cao Thắng
            </h1>
            <p className="truncate text-xs font-semibold text-blue-100 sm:text-sm">
              IT Lab Room Management
            </p>
          </div>
        </Link>

        {showLogout && (
          <div className="ml-auto hidden min-w-0 items-center gap-2 md:flex">
            <div ref={notificationRef} className="relative">
              <button
                type="button"
                onClick={() => setNotificationOpen((open) => !open)}
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Mở thông báo"
                aria-expanded={notificationOpen}
                aria-haspopup="dialog"
              >
                <Bell size={20} />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white ring-2 ring-[#193D87]">
                    {unreadCount}
                  </span>
                ) : null}
              </button>

              {notificationOpen && (
                <div className="absolute right-0 top-full mt-3 w-[min(92vw,420px)] overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-900 shadow-2xl">
                  <div className="border-b border-slate-100 px-5 pb-3 pt-4">
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="text-2xl font-bold text-slate-950">
                        Thông báo
                      </h2>
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="rounded-full px-2 py-1 text-sm font-bold text-[#193D87] hover:bg-slate-100 hover:text-[#132d66]"
                        aria-label="Đánh dấu tất cả đã đọc"
                      >
                        Đánh dấu tất cả đã đọc
                      </button>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setNotificationTab("all")}
                        className={`rounded-full px-4 py-2 text-sm font-bold ${
                          notificationTab === "all"
                            ? "bg-blue-100 text-[#193D87]"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Tất cả
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotificationTab("unread")}
                        className={`rounded-full px-4 py-2 text-sm font-bold ${
                          notificationTab === "unread"
                            ? "bg-blue-100 text-[#193D87]"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Chưa đọc
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[min(70vh,520px)] overflow-y-auto p-2">
                    <div className="flex items-center justify-between px-3 py-2">
                      <h3 className="text-base font-bold text-slate-800">Mới</h3>
                      <button
                        type="button"
                        className="text-sm font-bold text-[#193D87] hover:underline"
                      >
                        Xem tất cả
                      </button>
                    </div>

                    {loading ? (
                      <div className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                        Đang tải...
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={markAsRead}
                        />
                      ))
                    ) : (
                      <div className="px-4 py-10 text-center text-sm font-semibold text-slate-500">
                        Không có thông báo nào.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          <div ref={accountRef} className="relative min-w-0">
            <button
              type="button"
              onClick={() => setAccountOpen((open) => !open)}
              className="flex min-w-0 cursor-pointer items-center gap-3 px-2 py-1.5 text-white"
              aria-expanded={accountOpen}
              aria-haspopup="menu"
            >
              <div className="min-w-0 text-right leading-tight">
                <p className="truncate text-sm font-bold text-white">
                  {currentUser?.full_name || currentUser?.name || "Tài khoản"}
                </p>
                <p className="mt-1 truncate text-xs font-medium text-blue-100">
                  {currentUser?.email || roleLabel || "Đang đăng nhập"}
                </p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center">
                <UserRound size={20} />
              </span>
            </button>

            {accountOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-slate-200 bg-white p-2 text-slate-900 shadow-lg"
                role="menu"
              >
                <button
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                  onClick={handleLogout}
                  type="button"
                  role="menuitem"
                >
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
          </div>
        )}

      </div>
    </header>
  );
}
