import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/src/hooks/useAuth";
import AppSidebar from "./AppSidebar";
import { Plus } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useLocalStorage } from "@/src/hooks/useLocalStorage";
import { AnnouncementBanner } from "./AnnouncementBanner";

export default function AppLayout() {
  const { isAuthenticated, isLoading: authLoading, isUsingFallback } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useLocalStorage("sidebar-collapsed", false);
  const [showFallbackBanner, setShowFallbackBanner] = React.useState(true);
  const [forceShow, setForceShow] = React.useState(false);

  // Debug logs
  React.useEffect(() => {
    console.log("[AppLayout] Loading state:", authLoading, "isAuthenticated:", isAuthenticated, "forceShow:", forceShow);
  }, [authLoading, isAuthenticated, forceShow]);

  // Loading timeout
  React.useEffect(() => {
    if (authLoading) {
      const timer = setTimeout(() => {
        console.warn("[AppLayout] Loading timeout reached (5s). Forcing app to show.");
        setForceShow(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [authLoading]);

  const isLoading = authLoading && !forceShow;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest animate-pulse">
            Inizializzazione...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !forceShow) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Map path to title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "DASHBOARD";
    if (path === "/properties") return "NOTIZIE";
    if (path === "/contacts") return "BUYERS";
    if (path === "/activities") return "CALENDARIO";
    if (path === "/chat") return "CHAT";
    if (path === "/inserisci") return "PRODUZIONE";
    if (path === "/office") return "UFFICIO";
    if (path === "/settings") return "IMPOSTAZIONI";
    if (path === "/profile") return "PROFILO";
    return "";
  };

  return (
    <>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999, height: '34px', overflow: 'hidden' }}>
        <AnnouncementBanner />
      </div>
      <div style={{ paddingTop: '34px' }}>
        <div className="min-h-screen bg-[var(--bg-page)]">
          {/* Fallback Banner */}
          {isUsingFallback && showFallbackBanner && (
            <div 
              className="fixed left-0 right-0 z-[100] bg-orange-500 text-white px-4 py-2 flex items-center justify-between text-[11px] font-medium tracking-wide shadow-lg"
              style={{ top: 'calc(var(--banner-height) + env(safe-area-inset-top, 0px))' }}
            >
              <div className="flex items-center gap-2">
                <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px] font-bold">AVVISO</span>
                <span>Profilo non trovato su Sheets — usando profilo temporaneo. Aggiungi il tuo profilo nel foglio 'users'.</span>
              </div>
              <button 
                onClick={() => setShowFallbackBanner(false)}
                className="hover:bg-white/20 p-1 rounded transition-colors"
              >
                <Plus size={14} className="rotate-45" />
              </button>
            </div>
          )}

          {/* Sidebar Layout */}
          <AppSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

          {/* Main Content */}
          <main
            className={cn(
              "transition-all duration-200 ease-in-out p-6",
              isCollapsed ? "ml-[52px]" : "ml-[220px]"
            )}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
