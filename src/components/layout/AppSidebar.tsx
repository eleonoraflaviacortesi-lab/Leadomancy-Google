import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Home,
  UserSearch,
  CalendarDays,
  MessageCircle,
  TrendingUp,
  Briefcase,
  Settings2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Plus,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/hooks/useAuth";
import { useLocalStorage } from "@/src/hooks/useLocalStorage";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard, group: 1 },
  { label: "Notizie", path: "/properties", icon: Home, group: 2 },
  { label: "Buyers", path: "/contacts", icon: UserSearch, group: 2 },
  { label: "Calendario", path: "/activities", icon: CalendarDays, group: 2 },
  { label: "Chat", path: "/chat", icon: MessageCircle, group: 3 },
  { label: "Produzione", path: "/inserisci", icon: TrendingUp, group: 3 },
  { label: "Ufficio", path: "/office", icon: Briefcase, group: 3 },
  { label: "Impostazioni", path: "/settings", icon: Settings2, group: 4 },
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
    { icon: Home, label: "Nuova Notizia", action: () => { window.dispatchEvent(new CustomEvent('leadomancy:open-add-notizia')); setIsDropdownOpen(false); } },
    { icon: UserSearch, label: "Nuovo Buyer", action: () => { window.dispatchEvent(new CustomEvent('leadomancy:open-add-cliente')); setIsDropdownOpen(false); } },
    { icon: TrendingUp, label: "Nuovo Ciclo", action: () => { navigate('/inserisci'); setIsDropdownOpen(false); } },
    { icon: CalendarDays, label: "Nuova Riunione", action: () => { navigate('/office'); setIsDropdownOpen(false); } },
  ];

  const renderLabel = (label: string) => (
    <motion.span
      animate={{ 
        opacity: isCollapsed ? 0 : 1,
        width: isCollapsed ? 0 : 'auto'
      }}
      transition={{ duration: 0.2, delay: isCollapsed ? 0 : 0.05 }}
      style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
      className="font-outfit text-[13px] font-medium"
    >
      {label}
    </motion.span>
  );

  return (
    <motion.div
      animate={{ width: isCollapsed ? 64 : 220 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 h-screen bg-[#F5F4F0] z-50 flex flex-col"
      style={{ boxShadow: '1px 0 0 rgba(0,0,0,0.06)' }}
    >
      {/* Header */}
      <div className="p-5 pb-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-[#1A1A18] rounded-full flex-shrink-0 flex items-center justify-center text-white">
          ✦
        </div>
        <motion.span
          animate={{ opacity: isCollapsed ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className="font-bold text-[15px] tracking-wider text-[#1A1A18]"
        >
          ALTAIR
        </motion.span>
      </div>

      {/* Quick Add */}
      <div className="px-3 mb-4 relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={cn(
            "flex items-center bg-[#1A1A18] text-white rounded-full transition-all hover:opacity-90",
            isCollapsed ? "w-10 h-10 justify-center" : "w-full h-10 px-4 gap-2"
          )}
        >
          <Plus size={18} />
          {!isCollapsed && <span className="font-outfit font-semibold text-[12px] uppercase tracking-wide">AGGIUNGI</span>}
        </button>

        {isDropdownOpen && (
          <div className="absolute left-3 top-12 w-[200px] bg-white border border-[rgba(0,0,0,0.06)] rounded-xl shadow-xl p-1.5 z-[200]">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-full h-9 flex items-center gap-3 px-3 rounded-lg hover:bg-[rgba(0,0,0,0.04)] transition-colors"
              >
                <item.icon size={16} className="text-[#1A1A18]" />
                <span className="font-outfit text-[13px]">{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {[1, 2, 3, 4].map((group) => (
          <React.Fragment key={group}>
            {NAV_ITEMS.filter(item => item.group === group).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center h-10 rounded-full transition-all duration-200",
                    isCollapsed ? "w-10 justify-center" : "w-full px-3 gap-2.5",
                    isActive
                      ? "bg-[#1A1A18] text-white font-bold"
                      : "text-[rgba(0,0,0,0.35)] hover:bg-[rgba(0,0,0,0.06)]"
                  )
                }
              >
                <item.icon size={20} />
                {renderLabel(item.label)}
              </NavLink>
            ))}
            {group < 4 && <div className="h-[1px] bg-[rgba(0,0,0,0.06)] mx-2 my-2" />}
          </React.Fragment>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[rgba(0,0,0,0.06)] space-y-3">
        {user && (
          <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "px-1")}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1A1A18] to-[#444] flex items-center justify-center text-white text-[16px] font-bold">
              {user.avatar_emoji || user.full_name?.[0]?.toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="font-outfit font-bold text-[13px] truncate">{user.full_name}</span>
                <span className="font-outfit text-[10px] text-[#6366f1] uppercase tracking-wide truncate">{user.sede}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => signOut()}
            className={cn(
              "flex items-center justify-center text-[rgba(0,0,0,0.4)] hover:text-[#1A1A18] transition-colors",
              isCollapsed ? "w-10 h-10" : "h-10 px-3 gap-2"
            )}
          >
            <LogOut size={18} />
            {!isCollapsed && <span className="font-outfit text-[13px]">Esci</span>}
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-7 h-7 rounded-full bg-white border border-[rgba(0,0,0,0.08)] shadow-sm flex items-center justify-center text-[rgba(0,0,0,0.6)] hover:bg-[rgba(0,0,0,0.02)] transition-colors"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
