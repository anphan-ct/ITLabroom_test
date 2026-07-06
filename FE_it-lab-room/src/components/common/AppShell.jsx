import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import TopNav from "./TopNav.jsx";
import Header from "../layout/Header.jsx";
import Footer from "../layout/Footer.jsx";
import { clearAuthSession, getAuthSession } from "../../services/auth.service.jsx";

const roleLabels = {
  admin: "Quản trị hệ thống",
  teacher: "Giảng viên",
  student: "Sinh viên",
};

const loginPaths = {
  admin: "/admin/login",
  teacher: "/teacher/login",
  student: "/student/login",
};

export default function AppShell({ role, title, children }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const isAdmin = role === "admin";
  const currentUser = getAuthSession()?.user;

  const handleLogout = () => {
    clearAuthSession();
    navigate(loginPaths[role] || "/", { replace: true });
  };

  return (
    <div className="flex h-screen min-h-screen flex-col overflow-hidden bg-slate-50 text-slate-900">
      <Header
        onMenuToggle={() => setOpen(true)}
        onLogout={handleLogout}
        currentUser={currentUser}
        roleLabel={roleLabels[role]}
        showMenuButton
        showLoginLinks={false}
        showLogout
        hideLogoutOnMobile
      />

      {!isAdmin && <TopNav role={role} />}

      <div
        className={`flex min-h-0 flex-1 bg-[radial-gradient(circle_at_top_left,rgba(25,61,135,0.08),transparent_34rem)] ${
          isAdmin ? "gap-4 px-3 py-3 md:gap-5 md:px-5 md:py-5" : "px-3 py-4 sm:px-5 sm:py-5"
        }`}
      >
        {(
          <Sidebar
            role={role}
            open={open}
            onClose={() => setOpen(false)}
            onLogout={handleLogout}
            mobileOnly={!isAdmin}
            mobileSide="right"
          />
        )}

        <main className="app-scrollbar min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1440px] space-y-5 pb-4 md:space-y-6">
            {isAdmin && title && (
              <div className="border-b border-slate-200/80 pb-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
                      {title}
                    </h1>
                  </div>
                </div>
              </div>
            )}

            {children}
          </div>
        </main>
      </div>

      {!isAdmin && <Footer />}
    </div>
  );
}
