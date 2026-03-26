import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarDays,
  MessageSquare,
  ClipboardList,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/hooks/useAuth";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Notizie", path: "/properties", icon: Building2 },
  { label: "Buyers", path: "/contacts", icon: Users },
  { label: "Calendario", path: "/activities", icon: CalendarDays },
  { label: "Chat", path: "/chat", icon: MessageSquare },
  { label: "Produzione", path: "/inserisci", icon: ClipboardList },
  { label: "Ufficio", path: "/office", icon: BarChart3 },
  { label: "Impostazioni", path: "/settings", icon: Settings },
];

interface AppSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function AppSidebar({ isCollapsed, setIsCollapsed }: AppSidebarProps) {
  const { user, signOut } = useAuth();

  return (
    <aside
      className={cn(
        "flex flex-col fixed left-0 top-0 h-screen bg-[var(--bg-surface)] border-r border-[var(--border-light)] transition-all duration-200 ease-in-out z-50",
        isCollapsed ? "w-[52px]" : "w-[220px]"
      )}
    >
      {/* Header */}
      <div className="h-14 flex items-center px-3 gap-3">
        <div className="w-7 h-7 bg-black rounded-full flex-shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="white" style={{ width: 16, height: 16 }}>
            <path d="M12 0 L13.5 4.5 L18 4.5 L14.5 7 L16 11.5 L12 8.5 L8 11.5 L9.5 7 L6 4.5 L10.5 4.5 Z" />
          </svg>
        </div>
        {!isCollapsed && (
          <span className="font-bold text-[11px] uppercase tracking-[0.15em] text-[var(--text-primary)]">
            LEADOMANCY
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center h-[34px] rounded-lg px-2 gap-[10px] transition-colors",
                isActive
                  ? "bg-[var(--bg-subtle)] text-[var(--text-primary)] font-medium"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              )
            }
          >
            <item.icon size={18} className="flex-shrink-0" />
            {!isCollapsed && <span className="text-[14px]">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-[var(--border-light)] space-y-1">
        {!isCollapsed && user && (
          <NavLink
            to="/profile"
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-2 py-3 mb-1 rounded-lg transition-colors",
              isActive ? "bg-[var(--bg-subtle)]" : "hover:bg-[var(--bg-hover)]"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-lg border border-[var(--border-light)]">
              {user.avatar_emoji}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-bold truncate text-[var(--text-primary)]">{user.full_name}</span>
              <span className="text-[11px] text-[var(--text-muted)] font-medium truncate uppercase tracking-wider">{user.sede}</span>
            </div>
          </NavLink>
        )}

        <button
          onClick={() => signOut()}
          className={cn(
            "flex items-center h-[34px] w-full rounded-lg px-2 gap-[10px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
          )}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!isCollapsed && <span className="text-[14px]">Esci</span>}
        </button>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-center h-[34px] w-full rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
}
