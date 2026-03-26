import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
  LogOut,
  Plus,
  Calendar
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
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const navigate = useNavigate();

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    { icon: Building2, label: "Nuova Notizia", action: () => { window.dispatchEvent(new CustomEvent('leadomancy:open-add-notizia')); setIsDropdownOpen(false); } },
    { icon: Users, label: "Nuovo Buyer", action: () => { window.dispatchEvent(new CustomEvent('leadomancy:open-add-cliente')); setIsDropdownOpen(false); } },
    { icon: ClipboardList, label: "Nuovo Report", action: () => { navigate('/inserisci'); setIsDropdownOpen(false); } },
    { icon: Calendar, label: "Nuova Riunione", action: () => { navigate('/office'); setIsDropdownOpen(false); } },
  ];

  return (
    <aside
      className={cn(
        "flex flex-col fixed left-0 top-0 h-screen bg-[var(--bg-surface)] border-r border-[var(--border-light)] transition-all duration-200 ease-in-out z-50",
        isCollapsed ? "w-[52px]" : "w-[220px]"
      )}
    >
      {/* Header */}
      <div className="py-[15px] flex items-center px-3 gap-3">
        <div className="w-7 h-7 bg-black rounded-full flex-shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="white" style={{ width: 16, height: 16 }}>
            <path d="M12 1 L13.5 8.5 L20.5 6 L16 12 L22 14.5 L15 15.5 L17 22.5 L12 18 L7 22.5 L9 15.5 L2 14.5 L8 12 L3.5 6 L10.5 8.5 Z" />
          </svg>
        </div>
        {!isCollapsed && (
          <span className="font-bold text-[11px] uppercase tracking-[0.15em] text-[var(--text-primary)]">
            LEADOMANCY
          </span>
        )}
      </div>

      {/* Quick Add */}
      <div className="px-2 relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={cn(
            "flex items-center justify-center bg-[#1A1A18] text-white rounded-full h-[34px] transition-all hover:opacity-85",
            isCollapsed ? "w-[34px]" : "w-full gap-2"
          )}
        >
          <Plus size={isCollapsed ? 16 : 14} />
          {!isCollapsed && <span className="font-outfit font-semibold text-[11px] uppercase tracking-[0.1em]">AGGIUNGI</span>}
        </button>

        {isDropdownOpen && (
          <div className="absolute left-2 top-[42px] w-[200px] bg-white border border-[var(--border-light)] rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-1.5 z-[200]">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-full h-[36px] flex items-center gap-10 px-3 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
              >
                <item.icon size={15} className="text-[var(--text-secondary)]" />
                <span className="font-outfit text-[13px] text-[var(--text-primary)]">{item.label}</span>
              </button>
            ))}
          </div>
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
                "flex items-center h-[34px] rounded-full px-2 gap-[10px] transition-colors",
                isActive
                  ? "bg-[var(--bg-subtle)] text-[var(--text-primary)] font-medium"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              )
            }
          >
            <item.icon size={15} className="flex-shrink-0 ml-[5px]" />
            {!isCollapsed && <span className="text-[12px]">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-[var(--border-light)] space-y-1">
        {!isCollapsed && user && (
          <NavLink
            to="/profile"
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-2 py-3 mb-1 rounded-full transition-colors",
              isActive ? "bg-[var(--bg-subtle)]" : "hover:bg-[var(--bg-hover)]"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center text-lg border border-[var(--border-light)]">
              {user.avatar_emoji}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold truncate text-[var(--text-primary)]">{user.full_name}</span>
              <span className="text-[10px] text-[var(--text-muted)] font-medium truncate uppercase tracking-wider">{user.sede}</span>
            </div>
          </NavLink>
        )}

        <button
          onClick={() => signOut()}
          className={cn(
            "flex items-center h-[34px] w-full rounded-full px-2 gap-[10px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
          )}
        >
          <LogOut size={18} className="flex-shrink-0 ml-[5px]" />
          {!isCollapsed && <span className="text-[12px]">Esci</span>}
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
