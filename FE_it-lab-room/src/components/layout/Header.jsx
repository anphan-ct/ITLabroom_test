import { LogOut, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function Header({
  onMenuToggle,
  onLogout,
  currentUser,
  roleLabel,
  showMenuButton = true,
  showLogout = false,
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
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
          <div ref={accountRef} className="relative ml-auto hidden min-w-0 md:block">
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
        )}

      </div>
    </header>
  );
}
