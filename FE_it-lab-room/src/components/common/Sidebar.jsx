import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { roleMenus } from "./navigation.jsx";
import { getAuthSession } from "../../services/auth.service.jsx";

const roleLabels = {
  admin: "Quản trị viên",
  teacher: "Giảng viên",
  student: "Sinh viên",
};

export default function Sidebar({
  role = "admin",
  open = false,
  onClose,
  onLogout,
  mobileOnly = false,
  mobileSide = "left",
}) {
  const location = useLocation();
  const currentUser = getAuthSession()?.user;
  const navRef = useRef(null);
  const scrollStorageKey = `it-lab-room-sidebar-scroll-${role}`;
  const [expandedSections, setExpandedSections] = useState({});

  useLayoutEffect(() => {
    const savedScrollTop = Number(sessionStorage.getItem(scrollStorageKey) || 0);

    if (navRef.current) {
      navRef.current.scrollTop = savedScrollTop;
    }
  }, [location.pathname, scrollStorageKey]);

  const handleNavScroll = (event) => {
    sessionStorage.setItem(scrollStorageKey, String(event.currentTarget.scrollTop));
  };

  const toggleExpanded = (itemKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  const linkClassName = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
      isActive
        ? "bg-blue-50 text-[#193D87] md:bg-[#193D87] md:text-white md:shadow-sm"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
    }`;

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-slate-900/40 transition md:hidden ${
          open ? "block" : "hidden"
        }`}
      />

      <aside
        className={`fixed top-0 z-40 flex h-screen w-72 flex-col overflow-hidden border-slate-200 bg-white shadow-xl transition-transform md:static md:z-auto md:h-full md:shrink-0 md:translate-x-0 md:rounded-lg md:border md:shadow-sm ${mobileOnly ? "md:hidden" : ""} ${
          mobileSide === "right" ? "right-0 rounded-l-3xl border-l" : "left-0 rounded-r-3xl border-r"
        } ${
          open ? "translate-x-0" : mobileSide === "right" ? "translate-x-full" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-slate-100 bg-slate-50/70 p-4 md:hidden">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#193D87]">Tài khoản</p>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#193D87]">
              <UserRound size={25} />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-bold text-slate-900">
                {currentUser?.full_name || currentUser?.name || roleLabels[role]}
              </p>
              <p className="mt-1 truncate text-xs text-slate-500">
                {currentUser?.email || roleLabels[role]}
              </p>
            </div>
          </div>
        </div>

        <nav
          ref={navRef}
          onScroll={handleNavScroll}
          className="app-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-3 md:py-4"
        >
          {(roleMenus[role] || []).map((item) => {
            const Icon = item.icon;

            if (item.children?.length) {
              const hasActiveChild = item.children.some((child) => child.to === location.pathname);
              const isExpanded = expandedSections[item.to] ?? hasActiveChild;
              const isParentActive = location.pathname === item.to || hasActiveChild;

              return (
                <div key={item.to} className="group space-y-1">
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(item.to)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition ${
                        isParentActive
                          ? "bg-blue-50 text-[#193D87] md:bg-[#193D87] md:text-white md:shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                      }`}
                      aria-expanded={isExpanded}
                    >
                      <Icon size={18} />
                      <span className="flex-1">{item.label}</span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${isExpanded ? "rotate-180" : "rotate-0"}`}
                      />
                    </button>
                  </div>

                  <div className={`ml-4 space-y-1 border-l border-slate-200 pl-3 ${
                    isExpanded ? "block" : "hidden"
                  }`}>
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;

                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                              isActive
                                ? "bg-blue-50 text-[#193D87] md:bg-[#193D87] md:text-white md:shadow-sm"
                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                            }`
                          }
                        >
                          <ChildIcon size={16} />
                          <span>{child.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                end={item.to === `/${role}`}
                className={linkClassName}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-3 md:hidden">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#193D87] px-3 py-3 text-sm font-semibold text-white hover:bg-[#102752]"
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
    </>
  );
}
