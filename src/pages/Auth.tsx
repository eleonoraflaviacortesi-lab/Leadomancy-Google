import React from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { motion } from "motion/react";
import { Navigate } from "react-router-dom";

export default function Auth() {
  const { signIn, isLoading, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-page)] relative overflow-hidden">
      {/* Dot grid background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="dotGrid" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" className="text-[var(--text-primary)] opacity-[0.06]" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotGrid)" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="z-10 w-full max-w-[360px] p-10 bg-[var(--bg-surface)] border border-[var(--border-light)] rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] flex flex-col items-center"
      >
        <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" fill="white" style={{ width: 16, height: 16 }}>
            <path d="M12 0 L13.5 4.5 L18 4.5 L14.5 7 L16 11.5 L12 8.5 L8 11.5 L9.5 7 L6 4.5 L10.5 4.5 Z" />
          </svg>
        </div>
        
        <h1 className="text-[15px] font-bold uppercase tracking-[0.15em] mb-6">LEADOMANCY</h1>
        
        <div className="w-full h-[1px] bg-[var(--border-light)] mb-6" />
        
        <p className="text-[13px] text-[var(--text-secondary)] text-center mb-8">
          Accedi con il tuo account Google per continuare
        </p>
        
        <button
          onClick={() => signIn()}
          disabled={isLoading}
          className="flex items-center justify-center gap-3 w-full h-10 bg-[#1A1A18] text-white rounded-full px-6 text-[13px] font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLoading ? "Caricamento..." : "Continua con Google"}
        </button>
        
        <footer className="mt-8 text-[11px] text-[var(--text-muted)] uppercase tracking-wider">
          Accesso riservato al team
        </footer>
      </motion.div>
    </div>
  );
}
