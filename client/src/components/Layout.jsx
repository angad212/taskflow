import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  LayoutDashboard, FolderKanban, LogOut, CheckSquare, ChevronRight, Shield, User
} from "lucide-react";

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        isActive
          ? "bg-sky-600 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`
    }
  >
    <Icon size={18} />
    {label}
  </NavLink>
);

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex flex-col bg-white border-r border-slate-200 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center">
            <CheckSquare size={16} className="text-white" />
          </div>
          <span className="font-bold text-slate-800 text-lg">TaskFlow</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/projects" icon={FolderKanban} label="Projects" />
        </nav>

        {/* User info */}
        <div className="px-3 py-4 border-t border-slate-100">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-slate-50">
            <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
              {isAdmin ? <Shield size={14} className="text-sky-700" /> : <User size={14} className="text-sky-700" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full mt-2 px-3 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
