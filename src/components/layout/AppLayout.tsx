import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plane,
  Sun,
  UserRound,
  X,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Поездки", icon: Plane },
  { to: "/account", label: "Мой аккаунт", icon: UserRound },
];

function ThemeButton() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button type="button" className="grid size-11 place-items-center rounded-lg border text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/10" onClick={() => setDark((value) => !value)} aria-label={dark ? "Включить светлую тему" : "Включить тёмную тему"}>
      {dark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebar-collapsed") === "true");
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      localStorage.setItem("sidebar-collapsed", String(!value));
      return !value;
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-[#101814]">
      {mobileOpen && <button type="button" aria-label="Закрыть меню" className="fixed inset-0 z-40 bg-gray-950/40 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-white transition-[width,transform] duration-300 dark:bg-[#17211b] ${collapsed ? "lg:w-[88px]" : "lg:w-[280px]"} w-[280px] ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className={`flex h-18 items-center border-b px-5 ${collapsed ? "lg:justify-center lg:px-3" : "justify-between"}`}>
          <Link to="/" className="flex items-center gap-3 font-extrabold" onClick={() => setMobileOpen(false)}>
            <span className="grid size-9 place-items-center rounded-xl bg-forest text-white"><Plane size={18} /></span>
            <span className={collapsed ? "lg:hidden" : ""}>Вместе<span className="text-coral">.</span></span>
          </Link>
          <button type="button" className="grid size-10 place-items-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Закрыть меню"><X size={20} /></button>
        </div>

        <nav aria-label="Основная навигация" className="flex-1 overflow-y-auto px-3 py-6">
          <p className={`mb-3 px-3 text-xs font-bold uppercase tracking-wider text-gray-400 ${collapsed ? "lg:text-center lg:text-[0]" : ""}`}>{collapsed ? "•••" : "Меню"}</p>
          <ul className="space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <li key={to}>
                <NavLink to={to} end={to === "/"} title={collapsed ? label : undefined} onClick={() => setMobileOpen(false)} className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition ${collapsed ? "lg:justify-center" : ""} ${isActive ? "bg-brand-50 text-forest dark:bg-brand-500/15 dark:text-brand-300" : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"}`}>
                  <Icon className="size-5 shrink-0" />
                  <span className={collapsed ? "lg:hidden" : ""}>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t p-3">
          <button type="button" onClick={logout} title={collapsed ? "Выйти" : undefined} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-gray-500 hover:bg-error-50 hover:text-error-700 dark:text-gray-300 dark:hover:bg-error-500/10 dark:hover:text-red-300 ${collapsed ? "lg:justify-center" : ""}`}>
            <LogOut className="size-5 shrink-0" />
            <span className={collapsed ? "lg:hidden" : ""}>Выйти</span>
          </button>
        </div>
      </aside>

      <div className={`min-h-screen transition-[margin] duration-300 ${collapsed ? "lg:ml-[88px]" : "lg:ml-[280px]"}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/95 px-4 backdrop-blur dark:bg-[#17211b]/95 sm:h-18 sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" className="grid size-11 place-items-center rounded-lg border text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/10 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Открыть меню"><Menu size={20} /></button>
            <button type="button" className="hidden size-11 place-items-center rounded-lg border text-gray-500 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/10 lg:grid" onClick={toggleCollapsed} aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}>
              {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeButton />
            <Link to="/account" className="flex min-h-11 items-center gap-2 rounded-lg px-1.5 pr-3 hover:bg-gray-100 dark:hover:bg-white/10">
              {user.avatar ? <img src={user.avatar} alt="" className="size-8 rounded-full object-cover" /> : <span className="grid size-8 place-items-center rounded-full bg-brand-100 text-xs font-bold text-forest dark:bg-brand-500/20 dark:text-brand-300">{String(user.name || "?").slice(0, 1).toUpperCase()}</span>}
              <span className="hidden text-sm font-semibold sm:block">{user.name}</span>
            </Link>
          </div>
        </header>
        <div className="mx-auto w-full max-w-[1536px] p-4 md:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
