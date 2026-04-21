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
      className="font-outfit text-[13px] font-medium leading-none"
    >
      {label}
    </motion.span>
  );

  return (
    <motion.div
      animate={{ width: isCollapsed ? 64 : 220 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-[40px] h-[calc(100vh-40px)] bg-[#F5F4F0] z-50 flex flex-col"
    >
      {/* Header with Logo */}
      <div className="p-3 pb-2 flex items-center gap-3">
        <div 
          onClick={() => navigate('/')}
          className="w-10 h-10 bg-[#1A1A18] rounded-full flex-shrink-0 flex items-center justify-center text-white cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="white" style={{ width: 22, height: 22 }}>
            <path d="M12,2 L13.5,8.5 L19,6 L15.5,10.5 L22,12 L15.5,13.5 L19,18 L13.5,15.5 L12,22 L10.5,15.5 L5,18 L8.5,13.5 L2,12 L8.5,10.5 L5,6 L10.5,8.5 Z" />
          </svg>
        </div>
        <motion.span
          animate={{ opacity: isCollapsed ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className="font-extrabold text-[13px] tracking-[0.12em] text-[#1A1A18] leading-none"
        >
          ALTAIR
        </motion.span>
      </div>

      {/* Quick Add */}
      <div className="px-3 mb-3 relative" ref={dropdownRef}>
        <motion.button
          layout
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          animate={{ 
            width: isCollapsed ? 40 : '100%',
          }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            "flex items-center bg-white text-[rgba(0,0,0,0.5)] rounded-full transition-colors hover:text-[rgba(0,0,0,0.8)] h-10 overflow-hidden",
            isCollapsed ? "justify-center" : "px-0 gap-3"
          )}
        >
          <div className="flex items-center justify-center w-10 h-10 shrink-0">
            <Plus size={18} className="text-black" />
          </div>
          {!isCollapsed && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-outfit font-semibold text-[11px] uppercase tracking-[0.1em] leading-none whitespace-nowrap"
            >
              AGGIUNGI
            </motion.span>
          )}
        </motion.button>

        {isDropdownOpen && (
          <div className="absolute left-3 top-12 w-[200px] bg-white rounded-xl shadow-xl p-1.5 z-[200]">
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
      <nav className="flex-1 px-3 space-y-0.5">
        {[1, 2, 3].map((group) => (
          <React.Fragment key={group}>
            {NAV_ITEMS.filter(item => item.group === group).map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className="block"
              >
                {({ isActive }) => (
                  <motion.div
                    layout
                    initial={false}
                    animate={{ 
                      width: isCollapsed ? 40 : '100%',
                      backgroundColor: isActive ? '#1A1A18' : 'transparent',
                      borderRadius: isCollapsed ? '9999px' : '9999px'
                    }}
                    whileHover={{ 
                      backgroundColor: isActive ? '#1A1A18' : '#FFFFFF'
                    }}
                    transition={{ 
                      duration: 0.25, 
                      ease: [0.4, 0, 0.2, 1],
                      layout: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
                    }}
                    className={cn(
                      "flex items-center h-10 transition-colors relative overflow-hidden",
                      isCollapsed ? "justify-center" : "px-0 gap-3",
                      isActive ? "text-white" : "text-[rgba(0,0,0,0.5)] hover:text-[rgba(0,0,0,0.8)]"
                    )}
                  >
                    <div className="flex items-center justify-center w-10 h-10 shrink-0">
                      <item.icon size={18} />
                    </div>
                    {!isCollapsed && (
                      <div className="flex items-center h-10 flex-1">
                        {renderLabel(item.label)}
                      </div>
                    )}
                  </motion.div>
                )}
              </NavLink>
            ))}
            {group < 3 && <div className="h-0" />}
          </React.Fragment>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 mt-auto space-y-1">
        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "flex items-center h-10 transition-all duration-200 w-full mb-1",
            isCollapsed ? "justify-center" : "px-0 gap-3"
          )}
        >
          <div className="flex items-center justify-center w-10 h-10 shrink-0 text-[rgba(0,0,0,0.25)] hover:text-black transition-colors">
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </div>
          {!isCollapsed && (
            <span className="font-outfit text-[13px] font-medium text-[rgba(0,0,0,0.3)]">Comprimi</span>
          )}
        </button>

        {/* User Profile Section */}
        <div 
          onClick={() => navigate('/settings')}
          className={cn(
            "flex items-center gap-3 p-2 rounded-xl hover:bg-white transition-colors cursor-pointer mb-2",
            isCollapsed && "justify-center"
          )}
        >
          <div className="w-8 h-8 bg-white border border-black/10 rounded-full flex items-center justify-center text-[16px] flex-shrink-0 shadow-sm">
            {user?.avatar_emoji || '👤'}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-outfit font-bold text-[12px] text-[#1A1A18] truncate uppercase tracking-wide">
                {user?.nome?.split(' ')[0]}
              </span>
              <span className="font-outfit text-[10px] text-black/40 uppercase tracking-wider truncate">
                {user?.sede}
              </span>
            </div>
          )}
        </div>

        <motion.button
          layout
          onClick={() => signOut()}
          animate={{ 
            width: isCollapsed ? 40 : '100%',
          }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            "flex items-center h-10 rounded-full transition-colors relative overflow-hidden",
            isCollapsed ? "justify-center" : "px-0 gap-3",
            "bg-transparent text-[rgba(0,0,0,0.5)] hover:bg-white hover:text-[rgba(0,0,0,0.8)]"
          )}
        >
          <div className="flex items-center justify-center w-10 h-10 shrink-0">
            <LogOut size={16} />
          </div>
          {!isCollapsed && (
            <div className="flex items-center h-10 flex-1">
              <span className="font-outfit text-[13px] font-medium leading-none whitespace-nowrap">Esci</span>
            </div>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
